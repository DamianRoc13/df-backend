"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
function setupSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Dataweb Payments API')
        .setDescription('Checkouts, status, verify, void — NestJS vertical slices')
        .setVersion('1.0.0')
        .build();
    const doc = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('/docs', app, doc);
}
//# sourceMappingURL=swagger.js.map