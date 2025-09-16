import './bootstrap';
import '../css/app.css';  // 引入 Tailwind CSS
import { createApp } from 'vue'
import GoldenBellApp from './goldenbell/App.vue'

const components = {
  GoldenBellApp,
  // 其他組件可以在這裡註冊
}

const el = document.getElementById('vue-root')

if (el) {
  const componentName = el.dataset.component
  const Component = components[componentName]

  if (Component) {
    createApp(Component).mount(el)
  } else {
    console.warn(`Vue component "${componentName}" not found.`)
  }
}
