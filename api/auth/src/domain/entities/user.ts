import { EMAIL_REGEX } from '@ecommerce/shared';
import type { UserType } from '@ecommerce/shared';
import { InvalidEmailError } from '../errors/invalid-email.error.js';

export class User {
  private id: string;
  private tenantId?: string | null;
  private firstName: string;
  private lastName: string;
  private email: string;
  private passwordHash: string;
  private userType: UserType;

  private constructor({
    id,
    tenantId = null,
    firstName,
    lastName,
    email,
    passwordHash,
    userType,
  }: {
    id: User['id'];
    tenantId: User['tenantId'];
    firstName: User['firstName'];
    lastName: User['lastName'];
    email: User['email'];
    passwordHash: User['passwordHash'];
    userType: User['userType'];
  }) {
    this.id = id;
    this.tenantId = tenantId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.passwordHash = passwordHash;
    this.userType = userType;
  }

  static create({
    id,
    tenantId,
    firstName,
    lastName,
    email,
    passwordHash,
  }: {
    id: User['id'];
    tenantId: User['tenantId'];
    firstName: User['firstName'];
    lastName: User['lastName'];
    email: User['email'];
    passwordHash: User['passwordHash'];
    userType: User['userType'];
  }): User {
    if (!EMAIL_REGEX.test(email)) {
      throw new InvalidEmailError(email);
    }

    return new User({
      id,
      tenantId,
      firstName,
      lastName,
      email,
      passwordHash,
      userType: 'CUSTOMER',
    });
  }

  static fromDB({
    id,
    tenantId,
    firstName,
    lastName,
    email,
    passwordHash,
    userType,
  }: {
    id: User['id'];
    tenantId: User['tenantId'];
    firstName: User['firstName'];
    lastName: User['lastName'];
    email: User['email'];
    passwordHash: User['passwordHash'];
    userType: User['userType'];
  }): User {
    return new User({ id, tenantId, firstName, lastName, email, passwordHash, userType });
  }

  setPasswordHash(passwordHash: string): void {
    this.passwordHash = passwordHash;
  }

  getId(): User['id'] {
    return this.id;
  }

  getTenantId(): User['tenantId'] {
    return this.tenantId;
  }

  getFirstName(): User['firstName'] {
    return this.firstName;
  }

  getLastName(): User['lastName'] {
    return this.lastName;
  }

  getEmail(): User['email'] {
    return this.email;
  }

  getPasswordHash(): User['passwordHash'] {
    return this.passwordHash;
  }

  getTokenPayload(): { userId: string; userType: UserType; tenantId: User['tenantId'] } {
    return {
      userId: this.id,
      userType: this.userType,
      tenantId: this.tenantId,
    };
  }
}
