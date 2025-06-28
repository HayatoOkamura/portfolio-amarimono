const Kuroshiro = require('kuroshiro').default;
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');

async function testKuroshiro() {
  console.log('Testing kuroshiro conversions:');
  
  try {
    console.log('1. Initializing kuroshiro...');
    const kuroshiro = new Kuroshiro();
    console.log('2. Initializing analyzer...');
    await kuroshiro.init(new KuromojiAnalyzer());
    console.log('3. Initialization complete!');
    
    console.log('\n=== Testing conversions ===');
    
    console.log('\nInput: 玉ねぎ');
    const result1 = await kuroshiro.convert('玉ねぎ', { to: 'hiragana', mode: 'normal' });
    console.log('toHiragana:', result1);
    
    console.log('\nInput: 玉ねぎ (with different modes)');
    const result1a = await kuroshiro.convert('玉ねぎ', { to: 'hiragana', mode: 'spaced' });
    console.log('toHiragana (spaced):', result1a);
    const result1b = await kuroshiro.convert('玉ねぎ', { to: 'hiragana', mode: 'okurigana' });
    console.log('toHiragana (okurigana):', result1b);
    
    console.log('\nInput: キムチ');
    const result2 = await kuroshiro.convert('キムチ', { to: 'hiragana', mode: 'normal' });
    console.log('toHiragana:', result2);
    
    console.log('\nInput: たまねぎ');
    const result3 = await kuroshiro.convert('たまねぎ', { to: 'hiragana', mode: 'normal' });
    console.log('toHiragana:', result3);
    
    console.log('\nInput: にんじん');
    const result4 = await kuroshiro.convert('にんじん', { to: 'hiragana', mode: 'normal' });
    console.log('toHiragana:', result4);
    
    console.log('\nInput: 人参');
    const result5 = await kuroshiro.convert('人参', { to: 'hiragana', mode: 'normal' });
    console.log('toHiragana:', result5);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
  }
}

testKuroshiro(); 