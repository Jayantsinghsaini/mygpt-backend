import { GoogleGenAI } from "@google/genai";
import mongoose from 'mongoose'
import mySchema from '../models/mySchema.js';

let history = [];
let chatModel;
let collection = '';
const googleApiKey = process.env.GOOGLE_API_KEY;
const mongoURI = process.env.MONGO_URI;

const ai = new GoogleGenAI({ apiKey: googleApiKey });
const ConfigModel = mongoose.model('config-collections', mySchema);

export const initializeApp = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to DB');
        const data = await ConfigModel.findOne({}, { chat: 1, _id: 0 }).lean();
        const chatNum = data?.chat ?? 0;
        collection = 'chat' + chatNum;
        console.log('Using collection:', collection);
        chatModel = mongoose.model(collection, mySchema);

    } catch (err) {
        console.error('Failed to initialize app:', err);
    }
}

export const newCollection = async (req, res) => {
    try {
        const data = await ConfigModel.findOne({}, { chat: 1, _id: 0 }).lean();
        const oldChatNum = data?.chat ?? 0;
        const newChatNum = oldChatNum + 1;

        await ConfigModel.updateOne({ chat: oldChatNum }, { $set: { chat: newChatNum } });
        console.log('Updated chat number to', newChatNum);

        collection = 'chat' + newChatNum;
        chatModel = mongoose.model(collection, mySchema);
        console.log('Switched to new collection:', collection);

        res.send('New collection initialized');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to update collection');
    }
}

export const chatHandler = async (req, res) => {

    let requestText = req.body;

    history.push({
        role: 'user',
        parts: [{ text: requestText }],
    });

    const MAX_MESSAGES = 6;
    if (history.length > MAX_MESSAGES) {
        history = history.slice(-MAX_MESSAGES);
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: history,
        });

        let responseText = response.text

        let data = await chatModel.create({
            chatId: 1,
            conversationId: 1,
            request: requestText,
            response: responseText
        })
        console.log(data);

        history.push({
            role: 'model',
            parts: [{ text: responseText }],
        });

        console.log(response.text);
        res.send(response.text)
    }
    catch (error) {
        console.error(error)
    }
}

export const retrieveConversion = async (req, res) => {
    try {
        const data = await chatModel.find(
            {
                chatId: 1,
                conversationId: 1
            },
            {
                request: 1,
                response: 1,
                _id: 0
            }
        )
        console.log(data)
        res.send(data)
    }
    catch (error) {
        console.error(error)
    }
}

export const retrieveChats = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();

        const chatCollections = collections
            .map(col => col.name)
            .filter(name => /^chat\d+$/.test(name))
            .sort((a, b) => {
                const numA = parseInt(a.replace('chat', ''), 10);
                const numB = parseInt(b.replace('chat', ''), 10);
                return numB - numA;
            });

        const result = [];

        for (const collectionName of chatCollections) {
            const model = mongoose.model(collectionName, mySchema);
            const firstDoc = await model.findOne({}).sort({ _id: 1 }).lean();

            if (firstDoc && firstDoc.request) {
                result.push({ name: firstDoc.request.slice(0, 30), collection: collectionName });
            } else {
                result.push({ name: '(Empty Chat)', collection: collectionName });
            }
        }

        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving chat names');
    }
}

export const selectChat = async (req, res) => {

    collection = req.body
    console.log('Using collection:', collection);


    chatModel = mongoose.model(collection, mySchema);
}

export const deleteChat = async (req, res) => {
    try {
        const collectionName = req.body; // it's a plain string now 
        await mongoose.connection.db.dropCollection(collectionName);
        console.log('sucessfully delete collection', collectionName)
    } catch (error) {
        console.error('Error deleting collection:', error);

    }
}

export const tempChat = async (req, res) => {
    let requestText = req.body;
    let tempHistory = []
    tempHistory.push({
        role: 'user',
        parts: [{ text: requestText }],
    });

    const MAX_MESSAGES = 6;
    if (tempHistory.length > MAX_MESSAGES) {
        tempHistory = tempHistory.slice(-MAX_MESSAGES);
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: tempHistory,
        });

        let responseText = response.text



        tempHistory.push({
            role: 'model',
            parts: [{ text: responseText }],
        });

        console.log(response.text);
        res.send(response.text)
    }
    catch (error) {
        console.error(error)
    }
}
