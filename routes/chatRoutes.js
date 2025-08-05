import express from 'express'
import {newCollection, chatHandler, retrieveConversion, retrieveChats, selectChat, deleteChat, tempChat, } from '../controllers/chatController.js'
const router = express.Router()

router.get('/new-collection', newCollection)
router.post('/chat', chatHandler) 
router.get('/retrieve-conversation', retrieveConversion)
router.get('/retrieve-chats', retrieveChats)
router.post('/select-chat', selectChat) 
router.post('/delete-chat', deleteChat)
router.post('/temp-chat', tempChat)

export default router
