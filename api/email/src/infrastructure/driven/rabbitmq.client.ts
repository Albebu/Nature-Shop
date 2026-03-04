import amqplib from 'amqplib';
import type { ChannelModel, Channel } from 'amqplib';

export interface RabbitMQClient {
  readonly channelModel: ChannelModel;
  readonly channel: Channel;
}

export async function createRabbitMQConnection(url: string): Promise<RabbitMQClient> {
  const channelModel = await amqplib.connect(url);
  const channel = await channelModel.createChannel();

  return { channelModel, channel };
}
