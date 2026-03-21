import { Controller, Get, Header } from '@nestjs/common';
import { SeoService } from './seo.service';

@Controller()
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  getRobotsTxt() {
    return this.seoService.renderRobotsTxt();
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  getSitemapXml() {
    return this.seoService.renderSitemapXml();
  }
}
