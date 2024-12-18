import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class EmailService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor() {
    // Initialize OAuth2 Client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );

    // Initialize Gmail API instance
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async getEmails(accessToken: string, page: number = 1, perPage: number = 10) {
    // Validate the access token
    if (!accessToken) {
      throw new BadRequestException('Access token is required');
    }

    // Set the OAuth2 credentials
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });

    try {
      // Retrieve the list of messages from Gmail
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: perPage,
        // The API uses `pageToken` for pagination, not an offset
        pageToken: page > 1 ? await this.getPageToken(page, perPage, accessToken) : undefined,
      });

      const messages = listResponse.data.messages || [];

      // Retrieve full message details
      const emailDetails = await Promise.all(
        messages.map(async (message) => {
          const msgResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });

          const headers = msgResponse.data.payload.headers;
          const subject =
            headers.find((header) => header.name === 'Subject')?.value || 'No Subject';
          const from =
            headers.find((header) => header.name === 'From')?.value || 'Unknown Sender';

          return {
            id: message.id,
            snippet: msgResponse.data.snippet,
            subject,
            from,
          };
        }),
      );

      // Return the emails and total count
      return {
        emails: emailDetails,
        totalCount: listResponse.data.resultSizeEstimate || 0, // Total estimated messages
        nextPageToken: listResponse.data.nextPageToken || null, // For next-page handling
      };
    } catch (error) {
      console.error('Error fetching emails:', error.message);
      throw new BadRequestException('Unable to fetch emails');
    }
  }

  /**
   * Helper method to retrieve the page token for a specific page number.
   */
  private async getPageToken(page: number, perPage: number, accessToken: string): Promise<string | undefined> {
    this.oauth2Client.setCredentials({ access_token: accessToken });

    let nextPageToken: string | undefined = undefined;

    // Loop through pages until reaching the desired one
    for (let currentPage = 1; currentPage < page; currentPage++) {
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: perPage,
        pageToken: nextPageToken,
      });
      nextPageToken = listResponse.data.nextPageToken;

      if (!nextPageToken) {
        throw new BadRequestException('Invalid page number or no more pages available');
      }
    }
    return nextPageToken;
  }

    // Fetch detailed email data by ID
    async getEmailById(emailId: string, accessToken: string) {
        try {
          if (!accessToken) {
            throw new InternalServerErrorException('Access token is required');
          }
    
          // Set OAuth2 credentials
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: accessToken });
    
          // Fetch the email details
          const emailResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: emailId,
            auth: oauth2Client,
            format: 'full', // Fetch full email content
          });
    
          const emailPayload = emailResponse.data;
    
          // Parse email details
          const parsedEmail = this.parseEmailDetails(emailPayload);
    
          // Fetch all replies (messages within the same thread)
          const replies = await this.getThreadMessages(
            emailPayload.threadId,
            accessToken,
            emailId,
          );
    
          return {
            ...parsedEmail,
            replies,
          };
        } catch (error) {
          console.error('Error fetching email details:', error.message);
          throw new NotFoundException('Unable to fetch email details.');
        }
      }
    
      // Helper to parse email details
      private parseEmailDetails(emailPayload: gmail_v1.Schema$Message) {
        const headers = emailPayload.payload.headers;
    
        const subject =
          headers.find((header) => header.name === 'Subject')?.value || 'No Subject';
        const from =
          headers.find((header) => header.name === 'From')?.value || 'Unknown Sender';
        const to =
          headers.find((header) => header.name === 'To')?.value || 'Unknown Recipient';
    
        // Extract plain text body
        const body = this.extractBody(emailPayload.payload);
    
        return {
          id: emailPayload.id,
          threadId: emailPayload.threadId,
          from,
          to,
          subject,
          body,
        };
      }
    
      // Helper to extract email body
      private extractBody(payload: gmail_v1.Schema$MessagePart): string {
        let body = 'No Content';
    
        if (payload.parts) {
          const part = payload.parts.find((p) => p.mimeType === 'text/plain');
          if (part?.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        } else if (payload.body?.data) {
          body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }
    
        return body;
      }
    
      // Fetch all thread messages (replies) excluding the original email
      private async getThreadMessages(
        threadId: string,
        accessToken: string,
        originalEmailId: string,
      ) {
        try {
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: accessToken });
    
          const threadResponse = await this.gmail.users.threads.get({
            userId: 'me',
            id: threadId,
            auth: oauth2Client,
          });
    
          const messages = threadResponse.data.messages || [];
          const replies = messages
            .filter((msg) => msg.id !== originalEmailId) // Exclude the original email
            .map((msg) => this.parseEmailDetails(msg));
    
          return replies;
        } catch (error) {
          console.error('Error fetching thread messages:', error.message);
          return [];
        }
      }
      // Function to send a reply to the email using Gmail API
      
      async sendReply(emailId: string, subject: string, body: string, accessToken: string) {
        if (!accessToken) {
          throw new BadRequestException('Access token is required.');
        }
      
        // Set the credentials using the access token
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
      
        // Create a Gmail API instance
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
        try {
          // Retrieve the original email using the emailId
          const originalEmail = await gmail.users.messages.get({
            userId: 'me',
            id: emailId,
          });
      
          // Extract the required details from the original email
          const threadId = originalEmail.data.threadId; // Required to keep the reply in the same thread
          const originalHeaders = originalEmail.data.payload.headers;
      
          // Find the original 'Message-ID' header
          const inReplyTo = originalHeaders.find((header) => header.name === 'Message-ID')?.value;
      
          if (!threadId || !inReplyTo) {
            throw new BadRequestException('Original threadId or Message-ID not found.');
          }
      
          // Get the original sender's email
          const fromEmail = originalHeaders.find((header) => header.name === 'From')?.value;
      
          // Get your own email address
          const myEmail = await this.getAuthenticatedUserEmail(accessToken);
      
          if (!fromEmail || !myEmail) {
            throw new BadRequestException('Sender or your email address is required.');
          }
      
          // Create a MIME message for the reply
          const rawMessage = this.createReplyMessage(inReplyTo, fromEmail, myEmail, subject, body);
      
          // Send the reply email within the same thread
          await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: rawMessage,
              threadId: threadId, // Attach to the same thread
            },
          });
      
          return { message: 'Reply sent successfully in the same thread!' };
        } catch (error) {
          console.error('Error replying to email:', error);
          throw new BadRequestException('Failed to send reply.');
        }
      }
      
      
      private createReplyMessage(inReplyTo: string, to: string, from: string, subject: string, body: string) {
        // Ensure the subject starts with "Re:" only once
        const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
      
        // Construct the MIME message with proper threading headers
        const messageParts = [
          `To: ${to}`,
          `From: ${from}`,
          `Subject: ${replySubject}`,
          `In-Reply-To: ${inReplyTo}`,  // Crucial for threading
          `References: ${inReplyTo}`,   // Maintains conversation thread
          'Content-Type: text/plain; charset="UTF-8"',
          'MIME-Version: 1.0',
          '',
          body,
        ];
      
        // Join the MIME message and encode it as base64 URL-safe
        const rawMessage = Buffer.from(messageParts.join('\n'))
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      
        return rawMessage;
      }
      
      
      
      // Helper function to get the authenticated user's email address
      private async getAuthenticatedUserEmail(accessToken: string) {
        try {
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: accessToken });
          const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
          const response = await gmail.users.getProfile({ userId: 'me' });
          return response.data.emailAddress;
        } catch (error) {
          console.error('Error retrieving authenticated user email:', error);
          throw new BadRequestException('Failed to retrieve user email address.');
        }
      }
    



}
