"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
try {
    const appRootEnv = path.resolve(process.cwd(), '.env');
    const distParentEnv = path.resolve(__dirname, '../.env');
    const envPath = fs.existsSync(appRootEnv)
        ? appRootEnv
        : fs.existsSync(distParentEnv)
            ? distParentEnv
            : null;
    if (envPath) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const idx = trimmed.indexOf('=');
                const key = trimmed.substring(0, idx).trim();
                let val = trimmed.substring(idx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (process.env[key] === undefined) {
                    process.env[key] = val;
                }
            }
        });
    }
}
catch (e) {
}
const env_validation_1 = require("./common/env-validation");
(0, env_validation_1.validateEnvironmentOrExit)();
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express_1 = require("express");
const helmet_1 = require("helmet");
const cookieParser = require("cookie-parser");
const cors_config_1 = require("./common/cors-config");
const url_util_1 = require("./common/url.util");
const request_id_middleware_1 = require("./common/request-id.middleware");
const http_exception_filter_1 = require("./common/http-exception.filter");
const sanitize_response_interceptor_1 = require("./common/sanitize-response.interceptor");
const cache_control_interceptor_1 = require("./common/cache-control.interceptor");
const trust_proxy_util_1 = require("./common/trust-proxy.util");
async function bootstrap() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const mailProvider = (process.env.MAIL_PROVIDER || 'smtp').trim().toLowerCase();
    const corsOriginsCount = (0, cors_config_1.getCorsOriginsCount)();
    const corsHosts = (0, cors_config_1.getAllowedCorsHosts)();
    const dbProjectRef = (0, url_util_1.getDatabaseProjectRef)();
    console.log(`Startup Config | NODE_ENV: ${nodeEnv} | Mail Provider: ${mailProvider} | CORS Origins Count: ${corsOriginsCount} | Allowed CORS Hosts: [${corsHosts.join(', ')}] | DB Project Ref: ${dbProjectRef}`);
    const dbUrl = process.env.DATABASE_URL || '';
    const match = dbUrl.match(/postgresql:\/\/[^@]+@([^/:]+)[:\/](.+?)(?:\?|$)/);
    if (match) {
        const host = match[1];
        const dbName = match[2];
        console.log(`Database: ${dbName} @ ${host}`);
    }
    else {
        console.log('Database: <unknown>');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const expressApp = app.getHttpAdapter().getInstance();
    const isProd = process.env.NODE_ENV === 'production';
    const trustProxyHops = (0, trust_proxy_util_1.parseTrustProxy)(process.env.TRUST_PROXY, isProd);
    expressApp.set('trust proxy', trustProxyHops);
    app.use((0, helmet_1.default)({
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"],
            },
        },
        crossOriginResourcePolicy: { policy: 'same-site' },
        noSniff: true,
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'no-referrer' },
        hidePoweredBy: true,
    }));
    app.use(cookieParser());
    app.use(request_id_middleware_1.requestIdMiddleware);
    app.use((req, res, next) => {
        const url = (req.originalUrl || req.url || '').toLowerCase();
        const isPublicBranding = url.includes('/settings/branding/logo') ||
            url.includes('/settings/branding/stamp');
        if (isPublicBranding) {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
            return next();
        }
        const isPrivateFileDownload = url.includes('/download') ||
            url.includes('/export') ||
            url.includes('/pdf') ||
            url.includes('/uploads') ||
            url.includes('/purchase-documents');
        if (isPrivateFileDownload) {
            res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
            res.setHeader('Cache-Control', 'private, no-store');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        else {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        next();
    });
    const defaultJsonParser = (0, express_1.json)({
        limit: '1mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    });
    const defaultUrlencodedParser = (0, express_1.urlencoded)({ extended: true, limit: '1mb' });
    const importJsonParser = (0, express_1.json)({
        limit: '50mb',
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    });
    const importUrlencodedParser = (0, express_1.urlencoded)({ extended: true, limit: '50mb' });
    app.use((req, res, next) => {
        const isImportRoute = req.originalUrl &&
            (req.originalUrl.includes('/leads/import') ||
                req.originalUrl.includes('/inventory/import'));
        if (isImportRoute) {
            importJsonParser(req, res, (err) => {
                if (err)
                    return next(err);
                importUrlencodedParser(req, res, next);
            });
        }
        else {
            defaultJsonParser(req, res, (err) => {
                if (err)
                    return next(err);
                defaultUrlencodedParser(req, res, next);
            });
        }
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new sanitize_response_interceptor_1.SanitizeResponseInterceptor(), new cache_control_interceptor_1.CacheControlInterceptor());
    app.enableCors({
        origin: cors_config_1.corsOriginCallback,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Range'],
        exposedHeaders: ['Content-Disposition', 'Content-Range', 'Content-Length', 'X-Request-Id'],
        credentials: true,
    });
    const port = process.env.PORT || 3333;
    await app.listen(port);
    console.log(`JNC-CRM API running at http://localhost:${port}/api/v1`);
}
bootstrap();
