# 🚀 Deployment Guide

## 📋 Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

## 🧪 Pre-Deployment Checklist

### ✅ Build Verification
```bash
npm run build
```
**Expected**: ✓ Successful build with no errors

### ✅ Type Checking
```bash
npx tsc --noEmit
```
**Expected**: ✓ No TypeScript errors

### ✅ Linting (if configured)
```bash
npm run lint
```
**Expected**: ✓ No linting errors

## 🔄 Pull Request Process

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow the established architecture patterns
- Add tests for new functionality
- Update documentation

### 3. Test Changes
```bash
npm run dev    # Development testing
npm run build  # Production build test
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat: Your descriptive commit message"
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Use the provided PR template
- Fill in all relevant sections
- Request review from team members

## 🏗️ Architecture Migration

### Current State
- ✅ New modular architecture implemented
- ✅ Original `App.tsx` still active
- ✅ Refactored version available as `App.refactored.tsx`

### Migration Steps
1. **Backup Current Version**
   ```bash
   cp App.tsx App.original.tsx
   ```

2. **Replace with Refactored Version**
   ```bash
   cp App.refactored.tsx App.tsx
   ```

3. **Update Imports**
   - Check all component imports
   - Update paths to new modules
   - Test functionality

4. **Remove Legacy Code**
   ```bash
   rm App.original.tsx
   rm App.refactored.tsx
   ```

5. **Test Thoroughly**
   ```bash
   npm run dev
   # Test all game features
   npm run build
   ```

## 🌐 Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run preview
# Or configure GitHub Actions for auto-deployment
```

### Environment Variables
Ensure these are set in production:
- `VITE_GEMINI_API_KEY` (optional, for AI commentary)

## 🔍 Post-Deployment Verification

### Functional Testing
- [ ] Game loads successfully
- [ ] Unit spawning works
- [ ] Combat system functions
- [ ] AI opponents spawn
- [ ] Resource generation works
- [ ] Victory/defeat conditions trigger
- [ ] Error boundaries display correctly

### Performance Monitoring
- [ ] Game loop runs smoothly
- [ ] No memory leaks
- [ ] FPS remains stable
- [ ] Load times acceptable

### Error Monitoring
- [ ] Console errors checked
- [ ] Error boundaries tested
- [ ] Network requests successful

## 🐛 Troubleshooting

### Build Errors
**Issue**: TypeScript compilation errors
**Solution**: Check type imports and interfaces in new modules

**Issue**: Module not found errors
**Solution**: Verify import paths and file extensions

### Runtime Errors
**Issue**: Game doesn't start
**Solution**: Check React hooks usage and state initialization

**Issue**: Performance degradation
**Solution**: Verify spatial grid is properly initialized

### Deployment Issues
**Issue**: 404 errors on assets
**Solution**: Check Vite base URL configuration

**Issue**: API key errors
**Solution**: Verify environment variable setup

## 📊 Monitoring

### Performance Metrics
- Game loop execution time
- Memory usage patterns
- Component render counts
- Network request timing

### Error Tracking
- JavaScript errors
- API failures
- User-reported issues

## 🔄 Rollback Plan

If deployment fails:
1. **Immediate Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Hotfix Branch**
   ```bash
   git checkout -b hotfix/issue-description
   # Fix issues
   git commit -m "fix: Description of fix"
   git push origin hotfix/issue-description
   ```

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review error logs
3. Check GitHub Issues
4. Contact development team

---

**Remember**: Test thoroughly in development before deploying to production! 🎮
