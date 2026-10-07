"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageAccess = exports.PAGE_ACCESS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PAGE_ACCESS_KEY = 'page_access';
const PageAccess = (pageKey) => (0, common_1.SetMetadata)(exports.PAGE_ACCESS_KEY, pageKey);
exports.PageAccess = PageAccess;
