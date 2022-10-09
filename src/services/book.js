import db from '../models'
import { Op } from 'sequelize'
import { v4 as generateId } from 'uuid'
const cloudinary = require('cloudinary').v2;


// READ
export const getBooks = ({ page, limit, order, name, available, price, ...query }) => new Promise(async (resolve, reject) => {
    try {
        const queries = { raw: true, nest: true } // nest: true -> lấy data từ bảng khác dựa vào khóa ngoại nó sẽ gom thành 1 object nested object, nếu không phí client nhìn vào category_code sẽ không biết thông tin của category là gì
        const offsetStep = (!page || +page <= 1) ? 0 : (+page - 1) 
        const fLimit = +limit || +process.env.LIMIT_BOOK
        queries.offset = offsetStep * fLimit // offset là số bản ghi bị bỏ qua
        queries.limit = fLimit
        if (order) queries.order = [order]
        if (name) query.title = { [Op.substring]: name }
        if (price) query.price = { [Op.between]: price }
        if (available) query.available = { [Op.gt]: available }
        const response = await db.Book.findAndCountAll({
            logging: (sql, queryObject) => {
                sendToElasticAndLogToConsole(sql, queryObject)
            },

            where: query,
            ...queries,
            attributes: {
                exclude: ['category_code', 'description']
            },
            include: [
                { model: db.Category, attributes: { exclude: ['createdAt', 'updatedAt'] }, as: 'categoryData' }
            ]
        })

        const minPrice = await db.Book.min('price');
        const maxPrice = await db.Book.max('price');

       // console.log(`min price is ${minPrice} and max price us ${maxPrice}`);

        function sendToElasticAndLogToConsole (sql, queryObject) {  
            // save the `sql` query in Elasticsearch
            console.log(sql)
            // use the queryObject if needed (e.g. for debugging)
        }

        console.log('available: ', response);

        resolve({
            err: response ? 0 : 1,
            mes: response ? 'Got' : 'Cannot found books',
            bookData: {...response, minPrice, maxPrice}
        })
    } catch (error) {
        reject(error)
    }
})
// CREATE
export const createNewBook = (body, fileData) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.Book.findOrCreate({
            where: { title: body?.title },
            defaults: {
                ...body,
                id: generateId(),
                image: fileData?.path,
                filename: fileData?.filename
            }
        })
        resolve({
            err: response[1] ? 0 : 1,
            mes: response[1] ? 'Created' : 'The title of the book already exists',
        })
        if (fileData && !response[1]) cloudinary.uploader.destroy(fileData.filename)
    } catch (error) {
        reject(error)
        if (fileData) cloudinary.uploader.destroy(fileData.filename)
    }
})
// UPDATE
export const updateBook = ({ bid, ...body }, fileData) => new Promise(async (resolve, reject) => {
    try {
        if (fileData) body.image = fileData?.path
        const response = await db.Book.update(body, {
            where: { id: bid }
        })
        resolve({
            err: response[0] > 0 ? 0 : 1,
            mes: response[0] > 0 ? `${response[0]} book updated` : 'Cannot update new book/ Book ID not found',
        })
        if (fileData && response[0] === 0) cloudinary.uploader.destroy(fileData.filename)
    } catch (error) {
        reject(error)
        if (fileData) cloudinary.uploader.destroy(fileData.filename)
    }
})
// DELETE
// [id1, id2]


/*
params = {
    bids=[id1, id2],
    filename=[filename1, filename2]
}
*/
export const deleteBook = (bids, filename) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.Book.destroy({
            where: { id: bids }
        })
        resolve({
            err: response > 0 ? 0 : 1,
            mes: `${response} book(s) deleted`
        })
        cloudinary.api.delete_resources(filename)
    } catch (error) {
        reject(error)
    }
})