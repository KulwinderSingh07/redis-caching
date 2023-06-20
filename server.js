const express=require("express")
const app=express()
const cors=require("cors")
const redis=require("redis")
const { default: axios } = require("axios")
const redisClient=redis.createClient()
const DEFAULT_EXIPRATION=3600

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())
function getOrSetCache(key,cb){
    console.log(key,"this is the key ")
    return new Promise((resolve,reject)=>{
            redisClient.get(key,async(error,data)=>{
                if(error) return reject(error);
                if(data!=null) return resolve(JSON.parse(data))
                const fetchdata=await cb()
                await redisClient.setEx(key,DEFAULT_EXIPRATION,JSON.stringify(fetchdata))
                resolve(fetchdata)
        })
        })
}
app.get("/photos",async(req,res)=>{
    try{
    await redisClient.connect()
    const albumId=req.query.albumId
    const photos=await getOrSetCache(`photos?albumId=${albumId}`,async()=>{
        const {data}=await axios.get(`https://jsonplaceholder.typicode.com/photos`,{params:{albumId}})
        return data
    })
    // await redisClient.quit()
    res.json(photos)
}catch(err){
    res.json(err.message)
}
})

app.get("/photos/:id",async(req,res)=>{
    await redisClient.connect()
    const photos=await getOrSetCache(`photos:${req.params.id}`,async()=>{
        const {data}=await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`)
        return data
    })
    res.json(photos)

})


app.listen(3001,()=>{
    console.log("server running on port 3001")
})