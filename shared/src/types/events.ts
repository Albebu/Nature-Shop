/**
 * Base domain event interface for all inter-service events.
 * Every event published to the message broker MUST conform to this structure.
 */
export interface DomainEvent<T> {
  readonly type: string;
  readonly payload: T;
  readonly occurredAt: string;
  readonly correlationId: string;
}

/**
 * Payload for the user.registered event.
 * Published by the auth service after a successful user registration.
 */
export interface UserRegisteredPayload {
  readonly userId: string;
  readonly email: string;
  readonly firstName: string;
  readonly verificationToken: string;
}

/**
 * Fully typed user.registered domain event.
 */
export type UserRegisteredEvent = DomainEvent<UserRegisteredPayload>;

/** Exchange name for user-related events (topic exchange). */
export const USER_EVENTS_EXCHANGE = 'user.events' as const;

/** Routing key for the user.registered event. */
export const USER_REGISTERED_ROUTING_KEY = 'user.registered' as const;
