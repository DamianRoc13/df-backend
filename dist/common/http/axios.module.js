"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
let AxiosModule = class AxiosModule {
};
exports.AxiosModule = AxiosModule;
exports.AxiosModule = AxiosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            axios_1.HttpModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => ({
                    baseURL: (cfg.get('OPPWA_URL') || process.env.OPPWA_URL || '').trim(),
                    timeout: 15000,
                    maxRedirects: 2,
                    headers: { 'User-Agent': 'df-backend/1.0' },
                }),
            }),
        ],
        exports: [axios_1.HttpModule],
    })
], AxiosModule);
//# sourceMappingURL=axios.module.js.map