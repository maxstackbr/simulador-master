// Valida regras do regulamento e telas do simulador no navegador (desktop e mobile).
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Os dados de public/data mudam sozinhos (sync do Letzplay), então os cenários rodam contra um
// snapshot fixo: a página recebe test/fixtures/e2e-*.json no lugar de data/*.json.
const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
const E2E_INDEX = JSON.parse(fixture('e2e-index.json'))

const names = async (page, matchIdx) =>
  page.locator('.match').nth(matchIdx).locator('.slot-name').allTextContents()

test.beforeEach(async ({ page }) => {
  await page.route('**/data/index.json', (route) => route.fulfill({ json: E2E_INDEX }))
  await page.route('**/data/ranking.json', (route) => route.fulfill({ body: fixture('e2e-ranking.json'), contentType: 'application/json' }))
  await page.route('**/data/history/*.json', (route) => route.fulfill({ body: fixture('e2e-ranking.json'), contentType: 'application/json' }))
  await page.goto('/')
  await page.waitForSelector('.match')
  await page.evaluate(() => localStorage.removeItem('master-ibi-aram-sim'))
  await page.reload()
  await page.waitForSelector('.match')
})

test('regra 3: chave A = 1º..8º e B = 9º..16º, nos confrontos da imagem', async ({ page }) => {
  // Categoria A (partidas 0-3): 1x8, 4x5, 2x7, 3x6
  expect(await names(page, 0)).toEqual(['Ueslen Silva', 'Thiago Atilio'])
  expect(await names(page, 1)).toEqual(['Roberto Vilas', 'André Di Celio'])
  expect(await names(page, 2)).toEqual(['João Andrade', "Max D'angelo"])
  expect(await names(page, 3)).toEqual(['Marinho Schramm', 'Leonardo Belchior'])
  // Categoria B (partidas 7-10): 9x16, 12x13, 10x15, 11x14
  expect(await names(page, 7)).toEqual(['Douglas Kuada', 'Andre Santana'])
  expect(await names(page, 8)).toEqual(['Franco Gonçales', 'Marco Tempesta'])
  expect(await names(page, 9)).toEqual(['Fabrício Costa', 'Lucas Claudio'])
  expect(await names(page, 10)).toEqual(['Sergio Trevisan', 'Marcos Nogueira'])
})

test('horários e quadras conforme a imagem oficial', async ({ page }) => {
  const heads = await page.locator('.match-head').allTextContents()
  expect(heads).toEqual([
    '08:00Quadra Tucano', '08:00Quadra Beija-Flor', '11:00Quadra Tucano', '11:00Quadra Beija-Flor',
    '14:00Quadra Tucano', '15:30Quadra Tucano', '10:00Quadra Tucano',
    '09:30Quadra Tucano', '09:30Quadra Beija-Flor', '12:30Quadra Tucano', '12:30Quadra Beija-Flor',
    '14:00Quadra Beija-Flor', '15:30Quadra Beija-Flor', '08:00Quadra Tucano',
  ])
})

test('regra 4: desistência na A promove o 9º e o 17º entra na B', async ({ page }) => {
  await page.click('tr:has-text("Marinho Schramm") .switch span')
  await expect(page.locator('tr:has-text("Caio Anjos") .tag-cat-B')).toHaveText('B · 16º')
  await expect(page.locator('tr:has-text("Douglas Kuada") .tag-cat-A')).toHaveText('A · 8º')
  await expect(page.locator('tr:has-text("Henrique Carelli") .tag-next')).toHaveText('próximo')
  expect(await names(page, 0)).toEqual(['Ueslen Silva', 'Douglas Kuada'])
  expect(await names(page, 3)).toEqual(['Roberto Vilas', "Max D'angelo"]) // 3x6 agora
  expect(await names(page, 7)).toEqual(['Fabrício Costa', 'Caio Anjos'])
  await expect(page.locator('.simbar')).toContainText('1 desistência')
  // desfazer pelo chip
  await page.click('.chip:has-text("Marinho Schramm")')
  expect(await names(page, 0)).toEqual(['Ueslen Silva', 'Thiago Atilio'])
})

test('troca de posições: só até 5 acima, e reflete na chave', async ({ page }) => {
  await page.click('tr:has-text("Caio Anjos") td.name') // 17º
  await expect(page.locator('tr.row-target')).toHaveCount(5)
  await expect(page.locator('tr.row-target td.name').first()).toContainText('Franco Gonçales') // 12º
  await expect(page.locator('tr:has-text("Sergio Trevisan")')).not.toHaveClass(/row-target/) // 11º: fora do alcance
  await page.click('tr:has-text("Marcos Nogueira") td.name') // 14º
  await expect(page.locator('tr:has-text("Caio Anjos") .tag-cat-B')).toHaveText('B · 14º')
  await expect(page.locator('tr:has-text("Caio Anjos") .rank-delta')).toContainText('era 17º')
  await expect(page.locator('tr:has-text("Marcos Nogueira") .rank-delta')).toContainText('era 14º')
  expect(await names(page, 10)).toEqual(['Sergio Trevisan', 'Caio Anjos'])
  await expect(page.locator('.simbar')).toContainText('1 troca')
  // o 1º não tem alvo de troca
  await page.click('tr:has-text("Ueslen Silva") td.name')
  await expect(page.locator('tr.row-target')).toHaveCount(0)
})

test('resultados: vencedor avança até a final e aparece como campeão', async ({ page }) => {
  const m = page.locator('.category-A .match')
  await m.nth(0).locator('.slot').nth(1).click() // Thiago vence Ueslen
  await m.nth(1).locator('.slot').nth(0).click() // Roberto
  await expect(m.nth(4).locator('.slot-name').nth(0)).toHaveText('Thiago Atilio')
  await expect(m.nth(4).locator('.slot-name').nth(1)).toHaveText('Roberto Vilas')
  await m.nth(4).locator('.slot').nth(0).click()
  await m.nth(2).locator('.slot').nth(0).click()
  await m.nth(3).locator('.slot').nth(0).click()
  await m.nth(5).locator('.slot').nth(1).click() // Marinho
  await expect(m.nth(6).locator('.slot-name').nth(1)).toHaveText('Marinho Schramm')
  await m.nth(6).locator('.slot').nth(0).click()
  await expect(page.locator('.category-A .champion')).toContainText('Thiago Atilio')
  // semifinal não jogável antes das quartas
  await expect(page.locator('.category-B .match').nth(4).locator('.slot').first()).toBeDisabled()
  // limpar simulação
  await page.click('button:has-text("Limpar simulação")')
  await expect(page.locator('.category-A .champion')).toHaveCount(0)
})

test('estado da simulação sobrevive ao recarregar', async ({ page }) => {
  await page.click('tr:has-text("Thiago Atilio") .switch span')
  await page.reload()
  await expect(page.locator('.simbar')).toContainText('1 desistência')
})

test('data da última atualização em destaque e seletor de versão', async ({ page }) => {
  await expect(page.locator('.updated')).toContainText('Última atualização do ranking')
  await expect(page.locator('.updated strong')).toContainText('2026')
  await expect(page.locator('button:has-text("Enviar planilha")')).toHaveCount(0)
  // O seletor lista as versões do índice servido à página (aqui, o snapshot fixo).
  await expect(page.locator('select option')).toHaveCount(E2E_INDEX.versions.length)
})

test('chave da esquerda para a direita, com rolagem horizontal própria no celular', async ({ page, isMobile }) => {
  const cols = await page.locator('.round').evaluateAll((els) => els.slice(0, 3).map((e) => e.getBoundingClientRect().x))
  expect(cols[0]).toBeLessThan(cols[1])
  expect(cols[1]).toBeLessThan(cols[2])
  const scroll = await page.locator('.bracket-scroll').first().evaluate((e) => e.scrollWidth > e.clientWidth)
  expect(scroll).toBe(isMobile)
})

test('tema: claro por padrão, alterna para escuro e lembra a escolha', async ({ page }) => {
  await page.evaluate(() => localStorage.removeItem('theme'))
  await page.reload()
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(bg).toBe('rgb(244, 247, 250)')
  await page.click('.icon-btn')
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  await page.reload()
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
  await page.evaluate(() => localStorage.removeItem('theme'))
})

test('ranking e chave na mesma tela: troca reflete sem navegar', async ({ page, isMobile }) => {
  await page.click('tr:has-text("Caio Anjos") td.name')
  await page.click('tr:has-text("Marcos Nogueira") td.name')
  await expect(page.locator('.match').nth(10).locator('.slot-name').nth(1)).toHaveText('Caio Anjos')
  if (isMobile) {
    await expect(page.locator('.jump')).toBeVisible()
    await page.click('.jump')
    await expect(page.locator('.jump')).toHaveText(/ranking/)
  } else {
    await expect(page.locator('.jump')).toBeHidden()
    const r = await page.locator('.layout-ranking').boundingBox()
    const b = await page.locator('.layout-bracket').boundingBox()
    expect(b.x).toBeGreaterThan(r.x + r.width - 1) // lado a lado
  }
})

test('layout: sem rolagem horizontal e alvos de toque ≥ 44px', async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  expect(overflow).toBe(false)
  for (const sel of ['.icon-btn', '.slot', 'select']) {
    const h = await page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height)
    expect(h, sel).toBeGreaterThanOrEqual(44)
  }
  // a coluna Desiste precisa estar visível sem rolar a tabela
  const box = await page.locator('tbody tr').first().locator('.switch').boundingBox()
  const vw = await page.evaluate(() => window.innerWidth)
  expect(box.x + box.width).toBeLessThanOrEqual(vw)
})
