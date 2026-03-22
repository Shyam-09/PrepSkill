import amqplib, { Channel } from "amqplib";

let connection: any = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {

  const url = process.env.RABBITMQ_URL || "amqp://localhost";

  connection = await amqplib.connect(url);

  channel = await connection.createChannel();

  connection.on("error", (err: any) => {
    console.error("[ContentService] RabbitMQ error:", err.message);
    channel = null;
    connection = null;
  });
  
  console.log("[ContentService] RabbitMQ connected");
};

export const getChannel = (): Channel => {
  if (!channel) throw new Error("[ContentService] RabbitMQ channel not initialised");
  return channel;
};

export const publishEvent = async (
  exchange: string,
  routingKey: string,
  payload: object
): Promise<void> => {
  const ch = getChannel();
  await ch.assertExchange(exchange, "topic", { durable: true });
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });
};

export const subscribeEvent = async (
  exchange: string,
  routingKey: string,
  queueName: string,
  handler: (payload: any) => Promise<void>
): Promise<void> => {
  const ch = getChannel();
  await ch.assertExchange(exchange, "topic", { durable: true });
  const { queue } = await ch.assertQueue(queueName, { durable: true });
  await ch.bindQueue(queue, exchange, routingKey);
  ch.prefetch(1);
  ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      ch.ack(msg);
    } catch (err) {
      console.error("[ContentService] Consumer error:", err);
      ch.nack(msg!, false, false);
    }
  });
};
