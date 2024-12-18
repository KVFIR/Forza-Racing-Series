import { InteractionResponseType } from 'discord-interactions';
import { eventService } from '../services/eventService.js';

export async function handleAddResults(req, res) {
  const { guild_id, data } = req.body;
  const messageId = data.options.find(opt => opt.name === 'message_id').value;

  try {
    // Находим событие
    const event = await eventService.findEvent(messageId);
    if (!event) {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "⚠️ Event not found",
          flags: 64
        }
      });
    }

    // Создаем модальное окно для ввода результатов
    return res.send({
      type: InteractionResponseType.MODAL,
      data: {
        title: "Add Race Results",
        custom_id: `results_modal_${messageId}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "results_list",
                label: "Enter results (one position per line)",
                style: 2, // PARAGRAPH
                placeholder: "1. @user1\n2. @user2\n3. @user3",
                required: true,
                min_length: 1,
                max_length: 4000
              }
            ]
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error handling add results:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "⚠️ Failed to process results",
        flags: 64
      }
    });
  }
}

// Обработчик отправки формы с результатами
export async function handleResultsSubmit(req, res) {
  const { guild_id, data } = req.body;
  const messageId = data.custom_id.replace('results_modal_', '');
  const resultsList = data.components[0].components[0].value;

  try {
    // Парсим результаты
    const results = parseResults(resultsList);
    
    // Обновляем событие
    await eventService.updateResults(messageId, results);

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "✅ Results have been added successfully!",
        flags: 64
      }
    });
  } catch (error) {
    console.error('Error submitting results:', error);
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `⚠️ ${error.message}`,
        flags: 64
      }
    });
  }
}

// Функция для парсинга результатов
function parseResults(resultsList) {
  const lines = resultsList.split('\n').filter(line => line.trim());
  const results = [];
  
  for (const line of lines) {
    // Ищем позицию и упоминание пользователя
    const match = line.match(/(\d+)\.\s*<@!?(\d+)>/);
    if (!match) {
      throw new Error(`Invalid format in line: ${line}`);
    }

    const [_, position, userId] = match;
    results.push({
      userId,
      position: parseInt(position),
      points: calculatePoints(parseInt(position))
    });
  }

  return results;
}

// Функция расчета очков
function calculatePoints(position) {
  const pointsTable = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1
  };
  return pointsTable[position] || 0;
}