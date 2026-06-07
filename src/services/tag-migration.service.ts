import {InjectRepository} from "@nestjs/typeorm";
import {File} from "../files/files.model";
import {Repository} from "typeorm";

export class TagMigrationService {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
    ) {}

    migrateTags(content: string | null): string | null {
        if (!content) {
            return null;
        }
        return content
            .replaceAll('[`c`]', '[C]')
            .replaceAll('[`/c`]', '[/C]')

            .replaceAll('[`t`]', '[T]')
            .replaceAll('[`/t`]', '[/T]')

            .replaceAll('[`b`]', '[B]')
            .replaceAll('[`/b`]', '[/B]')

            .replaceAll('[`i`]', '[I]')
            .replaceAll('[`/i`]', '[/I]')

            .replaceAll('[`u`]', '[U]')
            .replaceAll('[`/u`]', '[/U]')

            .replaceAll('[`p`]', '[P]')
            .replaceAll('[`/p`]', '[/P]')

            .replaceAll('[`l`]', '[L]')
            .replaceAll('[`/l`]', '[/L]')

            .replaceAll('[`lc`]', '[LC]')
            .replaceAll('[`/lc`]', '[/LC]');
    }

    async run() {
        const files = await this.fileRepository.find();

        let updated = 0;

        for (const file of files) {
            const newContent = this.migrateTags(file.content);

            if (newContent !== file.content) {
                file.content = newContent;

                await this.fileRepository.save(file);

                updated++;
                console.log(`Updated file ${file.id}`);
            }
        }

        console.log(`Migration complete. Updated ${updated} files.`);
    }
}