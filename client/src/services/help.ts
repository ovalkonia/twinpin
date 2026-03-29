import api from "./api"


export const handleContactUs = async (data: {
    email: string
    text: string
}) => {
    try {
        const response = await api.post("/contact-us", data)
        return response.data
    } catch (err) {
        throw err
    }
}