const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 强制同步逻辑说明：
 * 1. 所有的 Grade 和 Difficulty 必须完全遵循 Lark Base 的标注。
 * 2. 这里的数据是根据用户提供的 Lark Base 记录整理的完整映射表。
 * 3. 匹配逻辑：优先匹配具体的 "Class XX" 编号，确保 100% 准确。
 */

const larkBaseData = {
  // 基础课程
  "认识数字": { grade: "G1", difficulty: "1" },
  "加法基础": { grade: "G1", difficulty: "1" },
  "减法基础": { grade: "G1", difficulty: "1" },
  "Snack Distribution": { grade: "G1", difficulty: "1" }, // Class 6
  "Cube Net Geometry": { grade: "G1", difficulty: "2" }, // Class 8
  "Parentheses and Sign": { grade: "G2", difficulty: "2" }, // Class 1
  "Bar Graph Data": { grade: "G2", difficulty: "2" }, // Class 2
  "Multiplication Table of 5": { grade: "G1", difficulty: "1" }, // Class 3
  
  // 进阶课程 & 竞赛课程 (AMC 8 相关通常为 G5)
  "AMC 8 课程": { grade: "G5", difficulty: "4" },
  "Class 59": { grade: "G5", difficulty: "3" }, 
  "Class 162": { grade: "G5", difficulty: "5" }, // Triangle Area Ratio
  "Class 163": { grade: "G4", difficulty: "3" }, // Average Speed
  "Class 106": { grade: "G3", difficulty: "3" }, // Triangle Folding
  "Class 107": { grade: "G5", difficulty: "5" }, // Combinatorics
  "Class 108": { grade: "G4", difficulty: "4" }, // Trapezoid and Circle
  "Class 103": { grade: "G3", difficulty: "3" }, // Speed Distance Time
  "Class 104": { grade: "G4", difficulty: "4" }, // Counting Four Digit
  "Class 105": { grade: "G4", difficulty: "3" }, // Successive Discount
  "Class 109": { grade: "G2", difficulty: "2" }, // Rectangle Perimeter
  "Class 110": { grade: "G3", difficulty: "3" }, // AMC 8 Tree
  "Class 111": { grade: "G4", difficulty: "3" }, // Fractions Percentages
  "Class 114": { grade: "G5", difficulty: "4" }, // Fibonacci Sequence
  "Class 115": { grade: "G4", difficulty: "4" }, // Nested Circles
  "Class 116": { grade: "G5", difficulty: "5" }, // Modular Arithmetic
  "Class 119": { grade: "G5", difficulty: "4" }, // Large Number Primality
  "Class 12": { grade: "G5", difficulty: "4" },  // Quadratic Expressions
  "Class 120": { grade: "G5", difficulty: "4" }, // Divisibility Rules
  "Class 121": { grade: "G3", difficulty: "3" }, // Digits 0-6 Subtraction
  "Class 122": { grade: "G4", difficulty: "3" }, // Algebra Fraction
  "Class 123": { grade: "G4", difficulty: "4" }, // Prime Factorization Age
  "Class 124": { grade: "G5", difficulty: "4" }, // Equal Product Grouping
  "Class 125": { grade: "G5", difficulty: "4" }, // Trailing Zeros
  "Class 33": { grade: "G3", difficulty: "3" },  // Circular Gems
  "Class 126": { grade: "G4", difficulty: "3" }, // Comparing Large Fractions
  "Class 127": { grade: "G3", difficulty: "3" }, // 3D Cube Surface Area
  "Class 128": { grade: "G3", difficulty: "2" }, // Shadow Height Ratio
  "Class 129": { grade: "G4", difficulty: "4" }, // Pythagorean Theorem
  "Class 14": { grade: "G2", difficulty: "2" },  // Line-up Logic
  "Class 15": { grade: "G4", difficulty: "4" },  // Yellow Circle Perimeter
  "Class 29": { grade: "G2", difficulty: "2" },  // Number Pattern
  "Class 30": { grade: "G3", difficulty: "3" },  // Algebraic Shape
  "Class 34": { grade: "G3", difficulty: "3" },  // Working Backward
  "Class 35": { grade: "G4", difficulty: "3" },  // 3D Cube Surface Area Puzzle
  "Class 36": { grade: "G4", difficulty: "4" },  // Geometric Grid Pattern
  "Class 37": { grade: "G4", difficulty: "3" },  // Finding the Median
  "Class 38": { grade: "G3", difficulty: "2" },  // Proving Pi
  "Class 40": { grade: "G4", difficulty: "4" },  // Rolling Die Path
  "Class 41": { grade: "G4", difficulty: "3" },  // Square Pool
  "Class 42": { grade: "G5", difficulty: "5" },  // Hologram Coding
  "Class 45": { grade: "G3", difficulty: "3" },  // Classic Age Difference
  "Class 46": { grade: "G4", difficulty: "3" },  // Common Factor Shortcuts
  "Class 52": { grade: "G4", difficulty: "3" },  // Triangle and Polygon
  "Class 53": { grade: "G4", difficulty: "3" },  // Repeating Digit Patterns
  "Class 54": { grade: "G5", difficulty: "4" },  // Multiplication and Addition Rules
  "Class 7": { grade: "G2", difficulty: "2" },   // Interval Problem
  "Class 18": { grade: "G2", difficulty: "2" },  // Mental Math Grouping
  "Class 31": { grade: "G3", difficulty: "3" },  // Logic Grid Method
  "Class 113": { grade: "G5", difficulty: "5" }, // Maximize Black Surface Area
  "Class 130": { grade: "G5", difficulty: "4" }, // AMC 8 Fraction
  "Class 133": { grade: "G5", difficulty: "5" }, // Simplifying Massive Fractions
  "Class 134": { grade: "G5", difficulty: "4" }, // Recursive Triangle
  "Class 136": { grade: "G5", difficulty: "4" }, // Inscribed Square Ratios
  "Class 137": { grade: "G4", difficulty: "3" }, // Multi-Step Percentage
  "Class 17": { grade: "G3", difficulty: "2" },  // Long Division
  "Class 10": { grade: "G2", difficulty: "2" },  // Grid Logic Puzzle
  "Class 32": { grade: "G3", difficulty: "3" },  // Logic Grid Ranking
  "Class 49": { grade: "G4", difficulty: "4" },  // Parallelogram Side
  "Class 50": { grade: "G4", difficulty: "4" },  // Square and Trapezoid
  "Class 51": { grade: "G3", difficulty: "2" },  // Decimals
};

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: {
      course: {
        OR: [
          { courseTrack: 'larry-math' },
          { category: 'math' },
          { category: 'Math' },
          { category: 'competition' },
        ],
      },
    }
  });

  console.log(`🚀 开始强制同步：正在处理 ${lessons.length} 个课时...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const lesson of lessons) {
    let matchedGrade = null;
    let matchedDifficulty = null;

    // 1. 尝试匹配 Class 编号 (最准确)
    const classMatch = lesson.title.match(/Class\s+(\d+)/i);
    if (classMatch) {
      const classNum = classMatch[1];
      const key = `Class ${classNum}`;
      if (larkBaseData[key]) {
        matchedGrade = larkBaseData[key].grade;
        matchedDifficulty = larkBaseData[key].difficulty;
      }
    }

    // 2. 如果没有 Class 编号，尝试匹配关键词
    if (!matchedGrade) {
      for (const [keyword, data] of Object.entries(larkBaseData)) {
        if (lesson.title.includes(keyword)) {
          matchedGrade = data.grade;
          matchedDifficulty = data.difficulty;
          break;
        }
      }
    }

    // 3. 执行更新
    if (matchedGrade && matchedDifficulty) {
      const difficultyMap = {
        "1": "Easy",
        "2": "Easy",
        "3": "Medium",
        "4": "Hard",
        "5": "Hard"
      };
      
      const difficultyText = difficultyMap[matchedDifficulty] || "Medium";

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { 
          gradeLevel: matchedGrade,
          difficulty: difficultyText
        }
      });
      updatedCount++;
    } else {
      skippedCount++;
      // 对于没有在 Lark Base 明确找到的，保持现状或设为默认
      // console.log(`⚠️ 未匹配到 Lark Base 数据: ${lesson.title}`);
    }
  }

  console.log(`✅ 强制同步完成！`);
  console.log(`   - 成功同步: ${updatedCount} 个课时`);
  console.log(`   - 未匹配到记录: ${skippedCount} 个课时`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
