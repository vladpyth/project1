CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT
);

CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    category_id INT,
    stock_quantity INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_item (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT unique_user_product UNIQUE (user_id, product_id),
    CONSTRAINT fk_cart_item_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'В обработке',
    delivery_address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS order_item (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE RESTRICT
);


CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_cart_item_user ON cart_item(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_item_product ON cart_item(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_item_order ON order_item(order_id);


INSERT INTO "user" (login, password, email, full_name) 
VALUES ('admin', 'admin', 'admin@shop.com', 'Администратор')
ON CONFLICT (login) DO NOTHING;


INSERT INTO category (name) VALUES 
    ('Электроника'),
    ('Одежда'),
    ('Книги'),
    ('Игрушки'),
    ('Спорт')
ON CONFLICT (name) DO NOTHING;

INSERT INTO product (name, description, price, image_url, category_id, stock_quantity) VALUES 
    ('Смартфон Samsung Galaxy', 'Современный смартфон с отличной камерой', 29999.99, 'https://via.placeholder.com/300x200?text=Samsung', 1, 10),
    ('Ноутбук HP', 'Мощный ноутбук для работы и игр', 59999.99, 'https://via.placeholder.com/300x200?text=HP', 1, 5),
    ('Футболка хлопковая', 'Удобная футболка из 100% хлопка', 999.99, 'https://via.placeholder.com/300x200?text=T-Shirt', 2, 50),
    ('Джинсы классические', 'Классические джинсы синего цвета', 2499.99, 'https://via.placeholder.com/300x200?text=Jeans', 2, 30),
    ('Книга "Программирование на Java"', 'Учебник по программированию', 1299.99, 'https://via.placeholder.com/300x200?text=Book', 3, 20),
    ('Конструктор LEGO', 'Развивающий конструктор для детей', 1999.99, 'https://via.placeholder.com/300x200?text=LEGO', 4, 15),
    ('Мяч футбольный', 'Профессиональный футбольный мяч', 1499.99, 'https://via.placeholder.com/300x200?text=Ball', 5, 25)
ON CONFLICT DO NOTHING;

