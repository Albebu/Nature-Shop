export interface EmailSender {
  sendVerificationEmail(to: string, verificationToken: string, firstName: string): Promise<void>;
}
