console.log('📦 開始載入應用程式模組...')

import './bootstrap';
console.log('✅ Bootstrap 載入完成')

import '../css/app.css';  // 引入 Tailwind CSS
console.log('✅ CSS 載入完成')

import { createApp } from 'vue'
console.log('✅ Vue 載入完成')

import GoldenBellApp from './goldenbell/App.vue'
console.log('✅ GoldenBellApp 元件載入完成')

const components = {
  GoldenBellApp,
  // 其他組件可以在這裡註冊
}

console.log('🔍 尋找 vue-root 元素...')
const el = document.getElementById('vue-root')

if (el) {
  console.log('✅ 找到 vue-root 元素:', el)
  const componentName = el.dataset.component
  console.log('🎯 要載入的元件:', componentName)
  const Component = components[componentName]

  if (Component) {
    console.log('✅ 找到元件，開始掛載 Vue 應用程式...')
    try {
      createApp(Component).mount(el)
      console.log('🎉 Vue 應用程式掛載成功！')
    } catch (error) {
      console.error('❌ Vue 應用程式掛載失敗:', error)
    }
  } else {
    console.warn(`❌ Vue component "${componentName}" not found.`)
    console.log('📋 可用的元件:', Object.keys(components))
  }
} else {
  console.error('❌ 找不到 vue-root 元素')
}
