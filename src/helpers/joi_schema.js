import joi from 'joi'

export const email = joi.string().pattern(new RegExp('gmail.com$')).required().messages({
    'string.empty': `"email" cannot be an empty field`,
    'string.min': `Must have at least 8 characters`,
    'object.regex': `Email không khớp  phải có dạng mẫu "yourname@gmail.com"`,
    'string.pattern.base': `Email không khớp định dạng mẫu, email phải có dạng mẫu "yourname@gmail.com"`,
    'any.required': `"email" is a required field`
  })
export const password = joi.string()
.min(6)
//.pattern(new RegExp('/^(?=\S*[a-z])(?=\S*[A-Z])(?=\S*\d)(?=\S*[^\w\s])\S{8,30}$/'))
.label("Password")
.required()
.messages({
    'string.base': `"password" should be a type of 'text'`,
    'string.empty': `"password" cannot be an empty field`,
   // 'string.pattern.base': `password không khớp định dạng mẫu, email phải có dạng mẫu "yourname@gmail.com"`,
    'string.min': `"password" should have a minimum length haha of {#limit}`,
    'any.required': `"password" is a required field`
  })
export const title = joi.string().required()
export const price = joi.number().required()
export const available = joi.number().required()
export const category_code = joi.string().uppercase().alphanum().required()
export const image = joi.string().required()
export const bid = joi.string().required()
export const bids = joi.array().required()
export const filename = joi.array().required()