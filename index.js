import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { Client, GatewayIntentBits } from 'discord.js';
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import schedule from 'node-schedule';

// Create a new client with appropriate intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // For reading message content
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
});

// setting channel ID for every day msg
const channelId = "1178008891045449738"; // 替换为目标频道的 ID
const intervalTime = 5 * 60 * 1000; // 5分钟（单位：毫秒）

// Log in to the bot using the token from .env
client.login(process.env.DISCORD_TOKEN);

// Log a message when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


// Respond to incoming messages
client.on("messageCreate", async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if the message starts with '!crypto'
    if (message.content.startsWith('!crypto')) {
        // Inform the user that the bot is fetching data
        await message.channel.send('Fetching cryptocurrency data...');

        try {
            // Fetch data from CoinMarketCap API
            const response = await axios.get(
                'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': process.env.CMC_TOKEN,
                    },
                }
            );

            // Extract and format top cryptocurrencies
            const topCryptos = response.data.data.slice(0, 5) // Example: top 5 cryptocurrencies
                .map((coin) => `${coin.name} (${coin.symbol}): $${coin.quote.USD.price.toFixed(2)}`)
                .join('\n');

            // Send the data back to the Discord channel
            await message.channel.send(`Top Cryptocurrencies:\n${topCryptos}`);
        } catch (error) {
            console.error(error);
            // Send an error message
            await message.channel.send('Failed to fetch cryptocurrency data. Please try again later.');
        }
    }

});

// test bot online
client.on("messageCreate", async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    message.channel.send(`Yes i am here, key in !help for more information`);

});



client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Start the interval for fetching Fear and Greed data
  setInterval(async () => {
      try {
          // Fetch the latest Fear and Greed Index data
          const response = await axios.get(
              'https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest',
              {
                  headers: {
                      'X-CMC_PRO_API_KEY': process.env.CMC_TOKEN,
                  },
              }
          );

          // Extract the value and classification
          const { value, value_classification: classification } = response.data.data;

          // Log the fetched data (for debugging)
          console.log(`Fear and Greed Index: ${value} (${classification})`);

          // Check if the value is below 40
          if (value < 40) {
              const channel = client.channels.cache.get(channelId);
              if (channel) {
                  await channel.send(`⚠️ The Fear and Greed Index has dropped to ${value} (${classification}). Stay alert!`);
              } else {
                  console.error('Channel not found. Please verify the channel ID.');
              }
          }
      } catch (error) {
          console.error('Failed to fetch Fear and Greed Index:', error);
      }
  }, intervalTime);
});

//schedule.scheduleJob('53 12 * * *', async () => {
client.on("messageCreate", async (message) => {
    if (message.content.startsWith('!test')) {
    try {
        console.log("Fetching Fear and Greed data...");
  
        // Calculate the timestamp for the last 24 hours
        const now = Math.floor(Date.now() / 1000); // Current time in Unix timestamp
        const start = now - 24 * 60 * 60; // 24 hours ago
        console.log("Start Timestamp:", start);
  
        // Fetch historical data with parameters
        const response = await axios.get(
            `https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical`,
            {
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMC_TOKEN,
                },
                params: {
                    //start,
                    limit: 20, // Limit to 50 records (adjust if needed)
                },
            }
        );
  
        const data = response.data.data;
  
        // If no data is returned, log an error
        console.log(data);
        console.log("123");
  
        if (!data || data.length === 0) {
            console.log("No data available for the last 24 hours.");
            return;
        }
  
        // Filter data for entries within the last 24 hours and every 30 minutes
        const filteredData = data.filter(item => {
            const timestamp = parseInt(item.timestamp, 10);
            return timestamp >= start && timestamp <= now;
        }).filter((item, index, arr) => {
            // Retain only entries every 30 minutes (using index as proxy for interval)
            const nextItem = arr[index + 1];
            if (!nextItem) return true; // Include the last item
            const nextTimestamp = parseInt(nextItem.timestamp, 10);
            return nextTimestamp - parseInt(item.timestamp, 10) >= 30 * 60; // 30 minutes in seconds
        });
  
        console.log("Filtered Data:", filteredData);
  
        // Extract highest and lowest values
        const maxEntry = filteredData.reduce((max, item) => (item.value > max.value ? item : max));
        const minEntry = filteredData.reduce((min, item) => (item.value < min.value ? item : min));
  
        // Format message with results
        const message = `
  **Fear and Greed Index - Last 24 Hours (Every 30 Minutes)**
  📈 Highest: ${maxEntry.value} (${maxEntry.value_classification}) at ${new Date(maxEntry.timestamp * 1000).toLocaleString()}
  📉 Lowest: ${minEntry.value} (${minEntry.value_classification}) at ${new Date(minEntry.timestamp * 1000).toLocaleString()}
        `;
  
        // Send message to the specified channel
        const channel = await client.channels.fetch(channelId);
        await channel.send(message);
        console.log("Daily Fear and Greed report sent successfully.");
  
    } catch (error) {
        console.error("Error fetching or sending Fear and Greed data:", error);
    }}
  });
  