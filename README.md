# Argit

**A modern desktop personal finance tracker built with Electron**

Argit is a beautiful, privacy-focused desktop application for tracking your income, expenses, budgets, subscriptions, and savings goals. All your financial data stays local on your machine—no cloud, no accounts, no subscriptions.

![Version](https://img.shields.io/badge/version-1.2.2-blue.svg)
![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey.svg)

---

## What is Argit?

Argit is a desktop application that helps you take control of your personal finances. Whether you're tracking daily expenses, managing a monthly budget, monitoring subscriptions, or working toward savings goals, Argit provides a simple, intuitive interface that keeps all your data private and secure on your local machine.

Perfect for individuals who want:
- **Privacy-first** financial tracking (no cloud sync, no accounts)
- **Simple, visual** budget management
- **Automatic** month-end processing and surplus tracking
- **Smart** subscription management with bill date tracking
- **Goal-oriented** savings planning

---

## Features

### Transaction Management
- Add income and expense transactions with categories
- Real-time balance calculation and updates
- Transaction history with date filtering
- Support for savings pot deposits and withdrawals
- Automatic transaction categorization

### Budget Management
- Create custom budget categories with percentage allocations
- Visual budget tracking with spent/remaining amounts
- Automatic category spending calculations
- Monthly income allocation across categories
- Budget surplus tracking and distribution

### Subscription Tracking
- Track recurring subscriptions with bill dates
- Smart next-bill-date calculation
- Total monthly subscription cost overview
- Subscription status monitoring

### Savings Goals
- Set multiple savings goals with target amounts
- Fixed or percentage-based monthly contributions
- Track progress toward each goal
- Priority-based goal management
- Automatic allocation from savings pot

### Savings Pot
- Manual savings deposits
- Automatic month-end surplus allocation
- Track total accumulated savings
- Spend from savings pot with category tracking

### Monthly Statistics
- Current month income and expense summaries
- Net income calculations
- Transaction counts and averages
- Monthly budget performance

### User Experience
- Clean, modern interface
- Dark and light theme support
- System theme detection
- Responsive design
- Intuitive navigation tabs

### Privacy & Security
- All data stored locally on your machine
- No internet connection required
- No account creation or login
- Automatic data backups
- Transaction history backups

---

## Quick Start

### Prerequisites
- **Node.js** 18+ and npm

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

The app will open in a new window. The renderer (React) runs on `http://localhost:3000` and Electron connects automatically.

---

## Building for Production

### Build for Current Platform
```bash
npm run dist
```

### Platform-Specific Builds

**Linux (AppImage)**
```bash
npm run dist:linux
```
Output: `dist/Argit-1.2.2.AppImage`

**Windows**
```bash
npm run dist:win
```
Output: 
- `dist/Argit Setup 1.2.2.exe` (NSIS installer)
- `dist/Argit-1.2.2-portable.exe` (Portable version)

**macOS**
```bash
npm run dist:mac
```
Output:
- `dist/Argit-1.2.2.dmg` (DMG installer)
- `dist/Argit-1.2.2-mac.zip` (ZIP archive)

> **Note:** Building for Windows/macOS from Linux may require additional setup. It's recommended to build on the target platform.

---

## Development

### Project Structure
```
Money-Manager/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # Main entry point, IPC handlers
│   │   └── preload.js     # Preload script for security
│   └── renderer/          # React application
│       ├── components/    # React components
│       │   ├── BalanceDisplay.jsx
│       │   ├── TransactionForm.jsx
│       │   ├── TransactionList.jsx
│       │   ├── BudgetAllocation.jsx
│       │   ├── SavingsGoals.jsx
│       │   └── ...
│       ├── hooks/         # Custom React hooks
│       │   └── useLocalStorage.js
│       ├── utils/         # Utility functions
│       │   ├── budgetHelpers.js
│       │   ├── calculations.js
│       │   └── monthEndProcessing.js
│       └── App.jsx        # Main React component
├── assets/                # Icons and images
├── dist/                  # Build output
└── package.json
```

### Available Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Start development server (renderer + Electron) |
| `npm run dev:renderer` | Start Vite dev server only |
| `npm run dev:electron` | Start Electron only |
| `npm run build:renderer` | Build React app for production |
| `npm run dist` | Build for current platform |
| `npm run dist:linux` | Build Linux AppImage |
| `npm run dist:win` | Build Windows installers |
| `npm run dist:mac` | Build macOS installers |

### Tech Stack

- **Frontend Framework:** React 18.2
- **Desktop Framework:** Electron 26.0
- **Build Tool:** Vite 4.4
- **Icons:** Lucide React
- **Styling:** Tailwind CSS (via inline styles)
- **Package Builder:** Electron Builder 24.6

---

## Usage Guide

### Getting Started

1. **Set Your Starting Balance**
   - Go to Settings
   - Enter your current account balance
   - This becomes your baseline for tracking

2. **Configure Your Budget**
   - Navigate to the Budget tab
   - Set your monthly income
   - Create categories and allocate percentages
   - The app calculates budget amounts automatically

3. **Add Transactions**
   - Use the transaction form on the Overview tab
   - Select income or expense
   - Choose a category
   - Enter amount and description
   - Your balance updates automatically

4. **Track Subscriptions**
   - Add recurring subscriptions with bill dates
   - The app calculates next bill dates automatically
   - View total monthly subscription costs

5. **Set Savings Goals**
   - Create goals with target amounts
   - Choose fixed or percentage contributions
   - Track progress as you save

### Month-End Processing

Argit automatically processes month-end surplus:
- Calculates remaining balance at month end
- Moves surplus to savings pot
- Creates transaction backup
- Resets transactions for the new month
- Updates savings pot balance

---

## Configuration

### Data Storage Location

Argit stores all data locally:

- **Linux:** `~/.config/argit/`
- **Windows:** `%APPDATA%/argit/`
- **macOS:** `~/Library/Application Support/argit/`

### Data Files

- `argit-data.json` - Main data file (transactions, budgets, goals, settings)
- `argit-data.backup.json` - Automatic backup
- `transaction-backups/` - Monthly transaction history backups

### Resetting Data

To reset all app data:
```bash
# Linux
rm -rf ~/.config/argit/

# Windows
rmdir /s "%APPDATA%\argit"

# macOS
rm -rf ~/Library/Application\ Support/argit/
```

---

## Troubleshooting

### Build Issues

**RPM build fails on Linux:**
- RPM builds are not included by default (AppImage only)
- If you need RPM, install `rpm-tools`:
  ```bash
  sudo pacman -S rpm-tools  # Arch Linux
  sudo apt-get install rpm   # Debian/Ubuntu
  ```

**Windows/Mac builds on Linux:**
- Cross-platform building may require Wine (Windows) or macOS (Mac)
- Recommended: Build on the target platform

### Data Issues

**Savings pot resets:**
- Ensure you're using version 1.2.2+ (fix included)
- Check that `savingsPot` exists in your data file

**Categories disappear:**
- Categories are stored in `budgetConfig.categories`
- If empty, the app shows fallback categories in the selector
- Add categories via the Budget tab to replace fallbacks

---

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test on your target platform before submitting
- Update documentation if adding features

---

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components with [React](https://react.dev/)
- Icons from [Lucide](https://lucide.dev/)
- Built and packaged with [Electron Builder](https://www.electron.build/)

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the code comments for implementation details

---

**Made for personal finance management**

