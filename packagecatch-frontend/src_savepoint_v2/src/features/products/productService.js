import { supabase } from '../../shared/supabaseClient'

// Transform Supabase snake_case to frontend camelCase
const transformProduct = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    imageUrl: row.image_url,
    category: row.category,
    tag: row.tag,
    stockQuantity: row.stock_quantity,
    bg: row.bg_color, // The home page maps bg_color to `bg`
    active: row.active,
})

export const productService = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('id', { ascending: true })

        if (error) throw new Error(error.message)
        return data.map(transformProduct)
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw new Error(error.message)
        return transformProduct(data)
    },

    async create(productData) {
        // Convert camelCase to snake_case for DB
        const payload = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            original_price: productData.originalPrice,
            category: productData.category,
            tag: productData.tag,
            stock_quantity: productData.stockQuantity,
            bg_color: productData.bg,
            image_url: productData.imageUrl,
            active: productData.active ?? true
        }

        const { data, error } = await supabase
            .from('products')
            .insert([payload])
            .select()
            .single()

        if (error) throw new Error(error.message)
        return transformProduct(data)
    },

    async update(id, productData) {
        const payload = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            original_price: productData.originalPrice,
            category: productData.category,
            tag: productData.tag,
            stock_quantity: productData.stockQuantity,
            bg_color: productData.bg,
            image_url: productData.imageUrl,
            active: productData.active
        }

        const { data, error } = await supabase
            .from('products')
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return transformProduct(data)
    },

    async delete(id) {
        const { error } = await supabase
            .from('products')
            .update({ active: false })
            .eq('id', id)

        if (error) throw new Error(error.message)
    },
}