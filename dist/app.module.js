"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const configuration_1 = require("./config/configuration");
const axios_module_1 = require("./common/http/axios.module");
const payments_module_1 = require("./payments/payments.module");
const operations_module_1 = require("./operations/operations.module");
const prisma_module_1 = require("./prisma/prisma.module");
const history_payments_module_1 = require("./history-payments/history-payments.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            schedule_1.ScheduleModule.forRoot(),
            axios_module_1.AxiosModule,
            prisma_module_1.PrismaModule,
            payments_module_1.PaymentsModule,
            operations_module_1.OperationsModule,
            history_payments_module_1.HistoryPaymentsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map