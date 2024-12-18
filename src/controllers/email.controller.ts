import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EmailService } from '../services/email.service';
const cheerio = require('cheerio');
const axios = require('axios');

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Route: GET /emails/:id?accessToken=<token>
  @Get(':id')
  async getEmailDetails(@Param('id') emailId: string, @Query() query: any) {
    const accessToken = query.accessToken || query.token;
    if (!accessToken) {
      throw new BadRequestException('Access token is required.');
    }

    return await this.emailService.getEmailById(emailId, accessToken);
  }

  @Get('/api/thumbnail')
  async getThumbnail(@Query() query: any) {
    if (!query.url) {
      throw new BadRequestException( 'URL is required' );
    }
  
    try {
      // Fetch the HTML of the target page
      const { data } = await axios.get(query.url);
  
      // Parse the HTML and extract Open Graph image
      const $ = cheerio.load(data);
      const ogImage = $('meta[property="og:image"]').attr('content');
  
      if (ogImage) {
        return { thumbnail: ogImage };
      } else {
       // return res.status(404).json({ error: 'Thumbnail not found' });
      }
    } catch (error) {
      console.error('Error fetching thumbnail:', error.message);
      //return res.status(500).json({ error: 'Failed to fetch thumbnail' });
    }
  }

  @Get()
  async getEmails(@Query() query: any) {
    const accessToken = query.accessToken || query.token; // Accept both 'accessToken' and 'token'
    const page = query.page ? parseInt(query.page, 10) : 1; // Default to page 1
    const perPage = query.perPage ? parseInt(query.perPage, 10) : 10; // Default to 10 results per page

    // Validate access token
    if (!accessToken) {
      throw new BadRequestException('Access token is required.');
    }

    console.log('Access Token:', accessToken);
    console.log('Page:', page, 'Per Page:', perPage);

    // Call the service and return the response
    return await this.emailService.getEmails(accessToken, page, perPage);
  }
  @Post('send-reply/:id')
  async sendReply(
    @Param('id') emailId: string,
    @Query('token') accessToken: string,
    @Body() body: { subject: string; message: string },
  ) {
    const { subject, message } = body;
    if (!subject || !message) {
      throw new BadRequestException('Subject and message are required.');
    }

    return await this.emailService.sendReply(emailId, subject, message, accessToken);
  }
}
