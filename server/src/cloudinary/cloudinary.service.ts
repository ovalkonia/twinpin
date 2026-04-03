import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    constructor(private readonly config: ConfigService) {
        cloudinary.config({ cloudinary_url: config.getOrThrow('CLOUDINARY_URL') });
    }

    upload(file: Express.Multer.File, folder: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'auto' },
                (err, result) => (err ? reject(err) : resolve(result!.secure_url)),
            );
            Readable.from(file.buffer).pipe(stream);
        });
    }

    delete(publicId: string): Promise<void> {
        return cloudinary.uploader.destroy(publicId).then(() => {});
    }
}