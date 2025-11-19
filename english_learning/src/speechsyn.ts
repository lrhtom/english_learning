// src/api/progress.ts
import axios from 'axios'
const baseURL = 'http://localhost:3001/word_data'

export const getProgress     = () => axios.get(`${baseURL}/progress`).then(r => r.data)
export const resetProgress   = () => axios.put(`${baseURL}/progress/reset`).then(r => r.data)
export const setLearningCount = (total: number) => axios.put(`${baseURL}/progress/count`, { total }).then(r => r.data)
export const updatePointer = (delta = 1) => axios.patch(`${baseURL}/progress/pointer`, { delta }).then(r => r.data)