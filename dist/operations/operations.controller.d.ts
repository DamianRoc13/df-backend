import { OperationsService } from './operations.service';
import { VoidDto } from './dto/void.dto';
import { VerifyDto } from './dto/verify.dto';
export declare class OperationsController {
    private svc;
    constructor(svc: OperationsService);
    verify(q: VerifyDto): Promise<{
        source: string;
        data: any;
        note?: undefined;
    } | {
        source: string;
        data: any;
        note: string;
    }>;
    void(dto: VoidDto): Promise<any>;
}
