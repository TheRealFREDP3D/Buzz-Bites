# 🐝 Buzz vs Bite: Backyard Battle 🐜

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An epic real-time strategy game where bees and ants battle for backyard supremacy! Deploy units, manage resources, and defend your base in this fast-paced tower defense meets RTS hybrid.

## 🎮 Gameplay Overview

### The Battle
- **Bees vs Ants**: Command the bee colony to defend your hive against invading ant forces
- **Resource Management**: Balance between economy and military units
- **Strategic Placement**: Position units wisely across 7 unique lanes
- **Real-Time Combat**: Watch battles unfold in real-time with smooth animations

### Key Features
- 🏗️ **Unit Types**: Workers, Gatherers, Soldiers, Elite units, and Special forces
- 💰 **Economy System**: Passive income + active resource gathering
- ⚔️ **Combat Mechanics**: Range-based combat with defensive bonuses
- 🎯 **AI Opponent**: Smart ant AI with adaptive strategies
- 🏆 **Victory Conditions**: Destroy the enemy base to win

## 🎯 How to Play

### Getting Started
1. **Select a Unit**: Choose from available bee units in the control panel
2. **Choose a Lane**: Click on a valid lane to deploy your unit
3. **Manage Resources**: Balance spending between units and upgrades
4. **Defend Your Hive**: Prevent ants from reaching your bee base

### Lane Strategy
- **Lanes 1-3, 5-7**: Combat lanes for military units
- **Lane 4 (Center)**: Resource corridor - only Gatherers allowed
- **Resource Corridor**: Contains food items that gatherers can collect

### Unit Types
| Unit | Cost | Role | Special Ability |
|------|-------|------|----------------|
| 🐝 **Worker** | 5 nectar | Passive income | Generates 0.05 resources/tick |
| 👜🐝 **Gatherer** | 25 nectar | Active income | Collects 20 resources per trip |
| ⚔️🐝 **Soldier** | 37 nectar | Frontline fighter | Balanced attack/defense |
| 🚁🐝 **Elite** | 50 nectar | Fast attacker | High speed, good damage |
| 🚀🐝 **Special** | 75 nectar | Ranged powerhouse | Long-range attacks |

### Controls
- **Left Click**: Deploy selected unit to lane
- **Unit Panel**: Select different unit types
- **Upgrade Button**: Strengthen your units (costs resources)
- **Restart**: Start a new battle

### Resource Management
- **Starting Resources**: 50 nectar
- **Passive Income**: Workers generate resources automatically
- **Active Income**: Gatherers collect food from the center lane
- **Upgrades**: Each level increases unit stats by 50%

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/TheRealFREDP3D/Buzz-Bites.git
cd Buzz-Bites

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Add your API key (optional)
echo "VITE_GEMINI_API_KEY=your_api_key_here" >> .env
```

### Running the Game
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will be available at `http://localhost:3000`

## 🏗️ Technical Overview

### Architecture
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **Custom Game Engine** with spatial grid optimization
- **Real-time State Management** using React hooks and reducers

### Core Systems

#### Game Engine (`engine/GameEngine.ts`)
- **Spatial Grid**: O(1) unit lookups for optimal performance
- **Combat System**: Range-based damage with defensive stacking bonuses
- **AI System**: Adaptive ant opponent with strategic unit placement
- **Resource System**: Passive and active income generation

#### State Management (`engine/GameStateReducer.ts`)
- **Immutable Updates**: Predictable state changes
- **Action System**: Redux-style actions for all game events
- **Selectors**: Efficient derived state calculations

#### Unit System (`engine/UnitSystem.ts`)
- **Component-based Units**: Modular unit behaviors
- **Movement Patterns**: Faction-specific movement logic
- **Gatherer AI**: Smart resource collection routes

### Performance Optimizations
- **Spatial Grid**: Reduces collision detection from O(n²) to O(1)
- **Memoized Components**: Prevents unnecessary re-renders
- **Batched Updates**: Efficient state updates
- **Optimized Rendering**: Pre-calculated stack groups

### Game Balance
- **Economy Scaling**: Exponential upgrade costs
- **Unit Counters**: Rock-paper-scissors unit relationships
- **AI Difficulty**: Progressive difficulty scaling
- **Resource Flow**: Balanced income vs spending

## 🎨 Visual Design

### UI Components
- **Responsive Layout**: Works on desktop and mobile
- **Animated Units**: Smooth movement and attack animations
- **Visual Feedback**: Clear indicators for unit states
- **Health Bars**: Real-time HP visualization

### Art Style
- **Comic Book Aesthetic**: Fun, colorful backyard theme
- **Emoji Units**: Playful and recognizable unit representations
- **Gradient Backgrounds**: Dynamic lane coloring
- **Particle Effects**: Attack indicators and explosions

## 🤖 AI System

### Ant Behavior
- **Economy Priority**: Smart resource management
- **Defense Priority**: Reactive unit placement
- **Lane Analysis**: Identifies dangerous lanes
- **Unit Selection**: Weighted random choice based on resources

### Difficulty Scaling
- **Progressive Challenge**: AI gets stronger over time
- **Adaptive Strategy**: Responds to player tactics
- **Resource Management**: Efficient ant economy

## 🛠️ Development

### Project Structure
```
Buzz-Bites/
├── components/        # React UI components
├── engine/            # Game engine, reducer, and systems
├── hooks/             # Custom React hooks
├── utils/             # Game constants and utility functions
├── __tests__/         # Unit and integration tests
├── types.ts           # TypeScript type definitions
├── constants.ts       # Game constants and unit stats
└── App.tsx            # Main application component
```

### Key Files
- `App.tsx` - Main game component
- `engine/GameEngine.ts` - Core game logic and AI
- `engine/GameStateReducer.ts` - State management
- `engine/difficultyScaler.ts` - Level difficulty scaling
- `hooks/useGameState.ts` - Game state hook
- `utils/gameConstants.ts` - Centralized game constants
- `components/GameBoard.memo.tsx` - Optimized game board

### Build Process
- **Development**: Hot reload with Vite dev server
- **Production**: Optimized bundle with tree-shaking
- **Type Checking**: Full TypeScript compilation
- **Code Splitting**: Automatic chunk optimization

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build and deploy
npm run build
# Upload dist/ folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🧪 Testing

### Automated Testing
```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:coverage
```

### Build & Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Test your changes thoroughly
- Keep the code clean and documented

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing framework
- **Vite Team** - For the lightning-fast build tool
- **Tailwind CSS** - For the utility-first CSS framework
- **TypeScript Team** - For making JavaScript scalable

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/TheRealFREDP3D/Buzz-Bites/issues) page
2. Create a new issue with detailed information
3. Join our [Discord](https://discord.gg/your-server) (if available)

---

**Made with ❤️ by [TheRealFREDP3D](https://github.com/TheRealFREDP3D)**

*Defend the hive, commander! The ants are coming! 🐝⚔️🐜*
