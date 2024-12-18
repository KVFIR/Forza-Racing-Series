# Development Plan for Racing Bot

## Phase 1: Event Creation Enhancement ⏳
- [x] Update date input to use separate fields
- [x] Add title parameter to event creation
- [ ] Add max participants parameter
- [ ] Add event description parameter
- [ ] Add track selection
- [ ] Add car class selection
- [ ] Add custom image URL parameter
- [ ] Add event rules parameter

## Phase 2: Event Completion System 🔄
- [ ] Create /complete_event command
- [ ] Add admin permission checks
- [ ] Implement event status updates
- [ ] Update event display for completed events
- [ ] Add ability to reschedule events
- [ ] Add ability to cancel events

## Phase 3: Results System 🏆
- [ ] Create /add_results command
- [ ] Implement results modal interface
- [ ] Add results storage in database
- [ ] Add validation for results data
- [ ] Add best lap time tracking
- [ ] Add incident points system
- [ ] Add automatic points calculation

## Phase 4: Profile System Enhancement 👤
- [ ] Update profile display
- [ ] Add statistics calculation
- [ ] Implement event filtering (active/completed)
- [ ] Add results display
- [ ] Add personal best times
- [ ] Add achievements system
- [ ] Add driver rating system

## Phase 5: Points System 📊
- [ ] Design points calculation system
- [ ] Implement automatic points assignment
- [ ] Add points display in profiles
- [ ] Create leaderboard system
- [ ] Add season standings
- [ ] Add championship tracking
- [ ] Add team standings (future)

## Command Registration Optimization
- [ ] Cache command IDs in local file
- [ ] Implement command versioning
- [ ] Add command registration status endpoint
- [ ] Add health check endpoint
- [ ] Add command registration retry mechanism

## Database Structure

### Event Structure
```javascript
events/{eventKey} = {
  title: string,
  description: string,
  max_participants: number,
  role_id: string,
  date: number,          // Unix timestamp
  completed: boolean,    // Event status
  track: string,         // Track information
  car_class: string,     // Car class/category
  rules: string,         // Event rules
  image_url: string,     // Custom event image
  results: [             // Array of participant results
    {
      userId: string,
      position: number,
      points: number,
      best_lap: string,
      incidents: number
    }
  ],
  participants: [        // Array of registered participants
    {
      id: string,
      username: string,
      xbox_nickname: string,
      twitch_username: string,
      car_choice: string,
      registered_at: number
    }
  ],
  guild_id: string,
  channel_id: string,
  message_ids: string[],
  created_at: number,
  updated_at: number
}
```

## Implementation Order
1. Complete Phase 1 enhancements
2. Implement Phase 2 event management
3. Add Phase 3 results system
4. Enhance Phase 4 profiles
5. Deploy Phase 5 points system

## Future Enhancements
- [ ] Race statistics system
- [ ] Participant rankings
- [ ] Results history
- [ ] Results export feature
- [ ] Automatic notifications
- [ ] Team management system
- [ ] Championship management
- [ ] Qualifying sessions
- [ ] Practice session tracking
- [ ] Weather conditions tracking
