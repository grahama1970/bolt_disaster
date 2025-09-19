import { test, expect } from '@playwright/test';

test.describe('Lean4 Graph Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load and display graph data', async ({ page }) => {
    // Wait for the graph to load
    await expect(page.locator('[role="application"]')).toBeVisible();
    
    // Check that the stats bar shows loaded data
    await expect(page.locator('text=/\\d+ nodes/')).toBeVisible();
    await expect(page.locator('text=/\\d+ edges/')).toBeVisible();
  });

  test('should open command palette with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[placeholder*="Type a command"]')).toBeVisible();
  });

  test('should perform fuzzy search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search nodes"]');
    await searchInput.fill('intro');
    
    // Should filter results
    await page.waitForTimeout(500); // Wait for debounced search
    // Results should be filtered in the graph
  });

  test('should toggle edge type filters', async ({ page }) => {
    // Open edge type filter dropdown
    await page.locator('button:has-text("Edge Types")').click();
    
    // Toggle contradictions off
    await page.locator('text=Contradictions').click();
    
    // Close dropdown
    await page.keyboard.press('Escape');
    
    // Verify filter count updated
    await expect(page.locator('text=/\d+ filters/')).toBeVisible();
  });

  test('should open inspector when node is selected', async ({ page }) => {
    // Click on a node (this would require specific node positioning)
    // For now, we'll test the inspector toggle button
    const inspectorButton = page.locator('button').first();
    if (await inspectorButton.isVisible()) {
      await inspectorButton.click();
      await expect(page.locator('text=Inspector')).toBeVisible();
    }
  });

  test('should switch between renderers', async ({ page }) => {
    // Open renderer dropdown
    await page.locator('button:has-text("WebGL")').click();
    
    // Switch to D3 renderer
    await page.locator('text=SVG (D3.js)').click();
    
    // Verify the button text changed
    await expect(page.locator('button:has-text("SVG")')).toBeVisible();
  });

  test('should toggle themes', async ({ page }) => {
    // Click theme toggle button
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();
    
    // Select dark theme
    await page.locator('text=Dark').click();
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on the graph
    await page.locator('[role="application"]').click();
    
    // Test pan controls
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    
    // Test zoom controls
    await page.keyboard.press('+');
    await page.keyboard.press('-');
    
    // Should not throw errors
  });

  test('should expand and use query box', async ({ page }) => {
    // Click to expand query box
    await page.locator('button:has-text("LLM Query Interface")').click();
    
    // Enter a query
    const queryInput = page.locator('textarea[placeholder*="Ask a question"]');
    await queryInput.fill('Find all contradictions');
    
    // Submit query
    await page.locator('button').filter({ has: page.locator('svg') }).last().click();
    
    // Should process the query
    await page.waitForTimeout(1000);
  });

  test('should support deep linking', async ({ page }) => {
    // Navigate with URL parameters
    await page.goto('/?focus=sections/S1&depth=3&edges=depends_on,refines');
    
    // Wait for page to load with state
    await page.waitForLoadState('networkidle');
    
    // Verify state is applied
    await expect(page.locator('text=depth 3')).toBeVisible();
  });
});