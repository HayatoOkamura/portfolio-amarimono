UPDATE recipes SET 
instructions = '[
  {"stepNumber": 1, "instructions": "Boil pasta", "image_url": "https://example.com/step1.jpg"},
  {"stepNumber": 2, "instructions": "Mix egg and cheese", "image_url": "https://example.com/step2.jpg"}
]'::jsonb
WHERE name = 'Spaghetti Carbonara';

UPDATE recipes SET 
instructions = '[
  {"stepNumber": 1, "instructions": "Chop tomatoes", "image_url": "https://example.com/step1_tomato.jpg"},
  {"stepNumber": 2, "instructions": "Simmer tomatoes", "image_url": "https://example.com/step2_tomato.jpg"}
]'::jsonb
WHERE name = 'Tomato Soup';
