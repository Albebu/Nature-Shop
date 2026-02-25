import { EMAIL_REGEX } from '@ecommerce/shared';
import { InvalidEmailError } from '../errors/invalid-email.error.js';

export class User {
  private id: string;
  private firstName: string;
  private lastName: string;
  private email: string;
  private passwordHash: string;

  private constructor({
    id,
    firstName,
    lastName,
    email,
    passwordHash,
  }: {
    id: User['id'];
    firstName: User['firstName'];
    lastName: User['lastName'];
    email: User['email'];
    passwordHash: User['passwordHash'];
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.passwordHash = passwordHash;
  }

  static create({
    id,
    firstName,
    lastName,
    email,
    passwordHash,
  }: {
    id: User['id'];
    firstName: User['firstName'];
    lastName: User['lastName'];
    email: User['email'];
    passwordHash: User['passwordHash'];
  }): User {
    if (!EMAIL_REGEX.test(email)) {
      throw new InvalidEmailError(email);
    }

    return new User({ id, firstName, lastName, email, passwordHash });
  }

  static fromDB({
    id,
    firstName,
    lastName,
    email,
    passwordHash,
  }: {
    id: User['id'];
    firstName: User['firstName'];
    lastName: User['lastName'];
    email: User['email'];
    passwordHash: User['passwordHash'];
  }): User {
    return new User({ id, firstName, lastName, email, passwordHash });
  }

  getId(): User['id'] {
    return this.id;
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
}
