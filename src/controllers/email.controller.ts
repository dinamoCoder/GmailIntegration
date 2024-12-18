import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EmailService } from '../services/email.service';

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
