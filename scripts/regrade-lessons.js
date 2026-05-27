const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: {
      course: {
        category: 'Math'
      }
    }
  });

  console.log(`Found ${lessons.length} lessons to update grade and difficulty.`);

  for (const lesson of lessons) {
    const content = (lesson.title + ' ' + (lesson.description || '')).toLowerCase();
    
    // Default values
    let grade = 'G5';
    let difficulty = 'Medium';

    // Difficulty Logic
    if (
      content.includes('basic') || 
      content.includes('intro') || 
      content.includes('基础') || 
      content.includes('入门') ||
      content.includes('snack') ||
      content.includes('easy')
    ) {
      difficulty = 'Easy';
    } else if (
      content.includes('amc') || 
      content.includes('competition') || 
      content.includes('advanced') || 
      content.includes('hard') ||
      content.includes('竞赛') ||
      content.includes('挑战')
    ) {
      difficulty = 'Hard';
    }

    // Grade Logic
    // G1: Basic arithmetic, counting, simple logic
    if (
      content.includes('加减') || 
      content.includes('addition') || 
      content.includes('subtraction') || 
      content.includes('基础') || 
      content.includes('入门') || 
      content.includes('snack') || 
      content.includes('零食') ||
      content.includes('counting') ||
      content.includes('1-4-1')
    ) {
      grade = 'G1';
    } 
    // G2: Multiplication, word problems, age problems
    else if (
      content.includes('乘法') || 
      content.includes('multiplication') || 
      content.includes('和差') || 
      content.includes('age') || 
      content.includes('年龄') ||
      content.includes('riddle') ||
      content.includes('pattern')
    ) {
      grade = 'G2';
    } 
    // G3: Geometry basics, area, perimeter, 3D basics
    else if (
      content.includes('周长') || 
      content.includes('perimeter') || 
      content.includes('面积') || 
      content.includes('area') || 
      content.includes('rectangle') || 
      content.includes('长方形') ||
      content.includes('3d cube') ||
      content.includes('surface area')
    ) {
      grade = 'G3';
    } 
    // G4: Fractions, decimals, percentages, logic grids
    else if (
      content.includes('分数') || 
      content.includes('fraction') || 
      content.includes('小数') || 
      content.includes('decimal') || 
      content.includes('百分比') || 
      content.includes('percentage') || 
      content.includes('discount') ||
      content.includes('logic grid') ||
      content.includes('modular')
    ) {
      grade = 'G4';
    } 
    // G5: AMC 8, Algebra, Advanced Geometry, Number Theory
    else if (
      content.includes('amc') || 
      content.includes('竞赛') || 
      content.includes('algebra') || 
      content.includes('代数') || 
      content.includes('geometry') || 
      content.includes('几何') || 
      content.includes('triangle') || 
      content.includes('三角形') || 
      content.includes('fibonacci') ||
      content.includes('prime') ||
      content.includes('divisibility') ||
      content.includes('pythagorean')
    ) {
      grade = 'G5';
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { 
        gradeLevel: grade,
        difficulty: difficulty
      }
    });
  }

  console.log('Update complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
