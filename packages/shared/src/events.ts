export interface NotificationCreatedEvent {
  type: "notification.created";
  notificationId: string;
  userId: string;
  appId: string | null;
  renderedTitle: string | null;
  renderedBody: string;
}

export type ServerEvent = NotificationCreatedEvent;
