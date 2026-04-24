import './config'
import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { remindersScheduled } from './reminders'
export { createLoginCode, signInWithCode } from './auth-codes'
