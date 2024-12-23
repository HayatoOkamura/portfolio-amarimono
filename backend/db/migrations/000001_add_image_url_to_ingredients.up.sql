ALTER TABLE ingredients ADD COLUMN image_url TEXT;

INSERT INTO ingredients (name, image_url) VALUES 
('Tomato', 'https://example.com/images/tomato.jpg'), 
('Pasta', 'https://example.com/images/pasta.jpg'), 
('Carrot', 'https://example.com/images/carrot.jpg');