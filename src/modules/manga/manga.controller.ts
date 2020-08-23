import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { MangaService } from './services/manga.service';
import { Manga } from './entities/manga.entity';
import { Chapter } from './entities/chapter.entity';
import { CreateMangaDto } from './dto/createManga.dto';
import { NewChapterDto } from './dto/newChapter.dto';
import { ChaptersService } from './services/chapters.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import settings from 'src/common/settings';
import { PrepareChapterDto } from './dto/prepareChapter.dto';
import { UpdateChapterProgressDto } from './dto/updateChapterProgress.dto';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

@Controller('manga')
@UseGuards(JwtAuthGuard)
export class MangaController {
  constructor(
    private readonly mangaService: MangaService,
    private readonly chaptersService: ChaptersService,
  ) {}

  @Get()
  async getMangas(): Promise<Manga[]> {
    //return manga list
    return await this.mangaService.getMangas();
  }

  @Get(':id')
  async getManga(@Param('id') id: number): Promise<Manga> {
    //return general info about a specific manga
    return await this.mangaService.getManga(id);
  }

  @Get(':id/chapters')
  getChapters(@Param('id') id: number): Promise<Manga> {
    return this.mangaService.getMangaWithChapters(id);
  }

  @Get(':id/chapter/:chapterNo')
  async getChapter(
    @Param('id') id: number,
    @Param('chapterNo') chapterNo: number,
  ): Promise<Chapter> {
    //return specific chapter of a manga
    return await this.mangaService.getChapter(id, chapterNo);
  }

  @Post()
  createManga(@Body() createMangaDto: CreateMangaDto): Promise<Manga> {
    return this.mangaService.createManga(createMangaDto);
  }

  @Post(':id/chapters')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: settings.get('MANGA_FOLDER'),
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
    }),
  )
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  newChapter(
    @Param('id') id: number,
    @Body() newChapterDto: NewChapterDto,
    @UploadedFile() file: any,
  ): Promise<Chapter> {
    console.log(file);
    return this.chaptersService.saveChapter(id, newChapterDto, file);
  }

  @Post('prepareChapter')
  prepareChapter(
    @Body() prepareChapterDto: PrepareChapterDto,
  ): Promise<string[]> {
    return this.chaptersService.prepareChapter(prepareChapterDto);
  }

  @Post('updateChapterProgress')
  updateChapterProgress(@Body() body: UpdateChapterProgressDto): Promise<void> {
    this.chaptersService.updateChapterProgress(body);
    return Promise.resolve();
  }
}
