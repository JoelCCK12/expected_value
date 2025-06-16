import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { RefreshCw } from 'lucide-react';

const generateProblem = () => {
  const numOutcomes = Math.floor(Math.random() * 2) + 3;
  let remainingProbability = 1;
  const distribution = [];
  
  for (let i = 0; i < numOutcomes; i++) {
    const value = Math.floor(Math.random() * 20) - 5;
    let probability;
    
    if (i === numOutcomes - 1) {
      probability = Math.round(remainingProbability * 100) / 100;
    } else {
      probability = Math.round((Math.random() * remainingProbability * 0.8) * 100) / 100;
      remainingProbability -= probability;
    }
    
    distribution.push({ value, probability });
  }
  
  const solution = distribution.reduce((sum, item) => 
    sum + item.value * item.probability, 0
  ).toFixed(2);
  
  const explanation = distribution
    .map(item => `(${item.value} × ${item.probability})`)
    .join(' + ');
  
  return { distribution, solution, explanation };
};

const ExpectedValue = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Answer, setStep1Answer] = useState('');
  const [step2Answer, setStep2Answer] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [problems, setProblems] = useState([generateProblem()]);
  const [invalidAnswers, setInvalidAnswers] = useState({ step1: false, step2: false, step3: false });
  const [showSteps, setShowSteps] = useState(false);
  const [stepCompleted, setStepCompleted] = useState({
    step1: false,
    step2: false,
    step3: false
  });
  const [stepSkipped, setStepSkipped] = useState({
    step1: false,
    step2: false,
    step3: false
  });
  const [showNavigationButtons, setShowNavigationButtons] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(null);

  useEffect(() => {
    setProblems([generateProblem(), generateProblem(), generateProblem()]);
  }, []);

  useEffect(() => {
    if (stepCompleted.step1 && stepCompleted.step2 && stepCompleted.step3) {
      setShowNavigationButtons(true);
    }
  }, [stepCompleted]);

  const handleNavigateHistory = (direction) => {
    setNavigationDirection(direction);
    
    if (direction === 'back' && currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (direction === 'forward' && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }

    setTimeout(() => {
      setNavigationDirection(null);
    }, 300);
  };

  const checkStep1 = () => {
    const problem = problems[currentProblem];
    
    // Remove optional "E(X) = " prefix and clean the input
    const cleanInput = step1Answer.replace(/^E\(X\)\s*=\s*/, '').trim();
    
    // Create answer array from user input
    const userParts = cleanInput.split('+').map(part => {
      const cleanPart = part.trim().replace(/[()]/g, '');
      const [value, prob] = cleanPart.split(/[×*]/).map(s => s.trim());
      return { value: parseFloat(value), probability: parseFloat(prob) };
    });

    // Create expected array from problem
    const expectedParts = problem.distribution.map(item => ({
      value: item.value,
      probability: item.probability
    }));

    // Compare arrays allowing for different ordering
    const isCorrect = userParts.length === expectedParts.length &&
      userParts.every(userPart => 
        expectedParts.some(expected => 
          Math.abs(userPart.value - expected.value) < 0.01 &&
          Math.abs(userPart.probability - expected.probability) < 0.01
        )
      );

    if (isCorrect) {
      setInvalidAnswers(prev => ({ ...prev, step1: false }));
      setStepCompleted(prev => ({ ...prev, step1: true }));
      setStepSkipped(prev => ({ ...prev, step1: false }));
    } else {
      setInvalidAnswers(prev => ({ ...prev, step1: true }));
    }
  };

  const checkStep2 = () => {
    const problem = problems[currentProblem];
    
    // Remove optional "E(X) = " prefix and clean the input
    const cleanInput = step2Answer.replace(/^E\(X\)\s*=\s*/, '').trim();
    
    // Get individual products from user input and convert to numbers
    // First replace any "+-" with "-" to normalize the format
    const normalizedInput = cleanInput.replace(/\+-/g, '-');
    
    // Split on spaces or plus signs, and filter out empty strings
    // Use a regex that properly handles negative numbers
    const userProducts = normalizedInput
      .split(/(?=[+-])/)  // Split before + or - signs
      .filter(num => num.trim() !== '')
      .map(num => {
        // Handle cases where the number might start with a plus sign
        const cleanNum = num.trim().replace(/^\+/, '');
        return parseFloat(cleanNum);
      });

    // Calculate expected products
    const expectedProducts = problem.distribution
      .map(item => item.value * item.probability);

    // Sort both arrays to ensure consistent comparison
    const sortedUserProducts = [...userProducts].sort((a, b) => a - b);
    const sortedExpectedProducts = [...expectedProducts].sort((a, b) => a - b);

    // Compare arrays
    const isCorrect = sortedUserProducts.length === sortedExpectedProducts.length &&
      sortedUserProducts.every((userProduct, index) => 
        Math.abs(userProduct - sortedExpectedProducts[index]) < 0.01
      );

    if (isCorrect) {
      setInvalidAnswers(prev => ({ ...prev, step2: false }));
      setStepCompleted(prev => ({ ...prev, step2: true }));
      setStepSkipped(prev => ({ ...prev, step2: false }));
    } else {
      setInvalidAnswers(prev => ({ ...prev, step2: true }));
    }
  };

  const checkFinalAnswer = () => {
    // Remove optional "E(X) = " prefix and clean the input
    const cleanInput = finalAnswer.replace(/^E\(X\)\s*=\s*/, '').trim();
    const numAnswer = parseFloat(cleanInput);
    
    if (isNaN(numAnswer) || cleanInput === '') {
      setInvalidAnswers(prev => ({ ...prev, step3: true }));
      return;
    }
    
    const correct = Math.abs(numAnswer - parseFloat(problems[currentProblem].solution)) < 0.1;
    if (correct) {
      setShowSolution(true);
      setInvalidAnswers(prev => ({ ...prev, step3: false }));
      setStepCompleted(prev => ({ ...prev, step3: true }));
      setStepSkipped(prev => ({ ...prev, step3: false }));
    } else {
      setInvalidAnswers(prev => ({ ...prev, step3: true }));
    }
  };

  const skipStep = (step) => {
    if (step === 1) {
      const formula = problems[currentProblem].distribution
        .map(item => `(${item.value} × ${item.probability})`)
        .join(' + ');
      setStep1Answer(formula);
    } else if (step === 2) {
      const products = problems[currentProblem].distribution
        .map((item, index) => {
          const product = item.value * item.probability;
          if (index === 0) {
            // First number: no space before minus sign
            return product < 0 ? `-${Math.abs(product).toFixed(2)}` : product.toFixed(2);
          } else {
            // Other numbers: space before sign
            return product < 0 ? ` - ${Math.abs(product).toFixed(2)}` : ` + ${product.toFixed(2)}`;
          }
        })
        .join('');
      setStep2Answer(products);
    } else if (step === 3) {
      setFinalAnswer(problems[currentProblem].solution);
      setShowSolution(true);
    }
    setStepCompleted(prev => ({ ...prev, [`step${step}`]: true }));
    setStepSkipped(prev => ({ ...prev, [`step${step}`]: true }));
  };

  const nextProblem = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem(prev => prev + 1);
    } else {
      setProblems(prev => [...prev, generateProblem()]);
      setCurrentProblem(prev => prev + 1);
    }
    setInvalidAnswers({ step1: false, step2: false, step3: false });
    setStep1Answer('');
    setStep2Answer('');
    setFinalAnswer('');
    setShowSolution(false);
    setCurrentStep(1);
    setShowSteps(false);
    setStepCompleted({ step1: false, step2: false, step3: false });
    setStepSkipped({ step1: false, step2: false, step3: false });
    setShowNavigationButtons(false);
  };

  const startCalculation = () => {
    setShowSteps(true);
    setCurrentStep(1);
    setStep1Answer('');
    setStep2Answer('');
    setFinalAnswer('');
    setShowSolution(false);
    setInvalidAnswers({ step1: false, step2: false, step3: false });
    setStepCompleted({ step1: false, step2: false, step3: false });
    setStepSkipped({ step1: false, step2: false, step3: false });
    setShowNavigationButtons(false);
  };

  return (
    <>
      <style>{`
        @property --r {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }

        .glow-button { 
          min-width: auto; 
          height: auto; 
          position: relative; 
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          transition: all .3s ease;
          padding: 7px;
        }

        .glow-button::before {
          content: "";
          display: block;
          position: absolute;
          background: #fff;
          inset: 2px;
          border-radius: 4px;
          z-index: -2;
        }

        .simple-glow {
          background: conic-gradient(
            from var(--r),
            transparent 0%,
            rgb(0, 255, 132) 2%,
            rgb(0, 214, 111) 8%,
            rgb(0, 174, 90) 12%,
            rgb(0, 133, 69) 14%,
            transparent 15%
          );
          animation: rotating 3s linear infinite;
          transition: animation 0.3s ease;
        }

        .simple-glow.stopped {
          animation: none;
          background: none;
        }

        @keyframes rotating {
          0% {
            --r: 0deg;
          }
          100% {
            --r: 360deg;
          }
        }

        .nav-button {
          opacity: 1;
          cursor: default !important;
          position: relative;
          z-index: 2;
          outline: 2px white solid;
        }

        .nav-button-orbit {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: conic-gradient(
            from var(--r),
            transparent 0%,
            rgb(0, 255, 132) 2%,
            rgb(0, 214, 111) 8%,
            rgb(0, 174, 90) 12%,
            rgb(0, 133, 69) 14%,
            transparent 15%
          );
          animation: rotating 3s linear infinite;
          z-index: 0;
        }

        .nav-button-orbit::before {
          content: "";
          position: absolute;
          inset: 2px;
          background: transparent;
          border-radius: 50%;
          z-index: 0;
        }

        .nav-button svg {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <div className="w-[500px] h-auto mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] bg-white rounded-lg overflow-hidden">
        <div className={`px-4 ${showSteps ? 'pt-4' : 'p-4'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[#5750E3] text-sm font-medium select-none">Expected Value Calculator</h2>
            <Button 
              onClick={nextProblem}
              className="bg-[#008545] hover:bg-[#00703d] text-white px-4 h-[42px] flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              New Problem
            </Button>
          </div>

          {problems[currentProblem] && (
            <div className="space-y-4">
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">Outcome (x)</th>
                      <th className="border border-gray-300 p-2">Probability P(x)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems[currentProblem].distribution.map((row, index) => (
                      <tr key={index} className="bg-white">
                        <td className="border border-gray-300 p-2">{row.value}</td>
                        <td className="border border-gray-300 p-2">{row.probability}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!showSteps ? (
                <div className={`glow-button ${!showSteps ? 'simple-glow' : 'simple-glow stopped'}`}>
                  <button 
                    onClick={startCalculation}
                    className="w-full bg-[#008545] hover:bg-[#00703d] text-white text-sm py-2 rounded"
                  >
                    Calculate Expected Value
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 -mx-4 -mb-4">
                  <div className="p-4">
                    <div className="space-y-2">
                      <h3 className="text-[#5750E3] text-sm font-medium mb-2">
                        Steps to calculate the expected value:
                      </h3>
                      <div className="space-y-4">
                        <div className="w-full p-2 mb-1 bg-white border border-[#5750E3]/30 rounded-md">
                          <p className="text-sm font-semibold">
                            {currentStep === 1 && "Step 1: Write the expected value formula with the given values"}
                            {currentStep === 2 && "Step 2: Calculate each product"}
                            {currentStep === 3 && "Step 3: Calculate the final expected value"}
                          </p>
                          {currentStep === 1 && (
                            <>
                              {!stepCompleted.step1 ? (
                                <div className="flex items-center space-x-1 mt-2">
                                  <input
                                    type="text"
                                    value={step1Answer}
                                    onChange={(e) => {
                                      setStep1Answer(e.target.value);
                                      setInvalidAnswers(prev => ({ ...prev, step1: false }));
                                    }}
                                    placeholder="e.g., (6 × 0.1) + (4 × 0.3) + (-1 × 0.6)"
                                    className={`w-full text-sm p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#5750E3] ${
                                      invalidAnswers.step1 ? 'border-yellow-500' : 'border-gray-300'
                                    }`}
                                  />
                                  <div className="glow-button simple-glow">
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={checkStep1}
                                        className="bg-[#008545] hover:bg-[#00703d] text-white text-sm px-4 py-2 rounded-md min-w-[80px]"
                                      >
                                        Check
                                      </button>
                                      <button 
                                        onClick={() => skipStep(1)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md min-w-[80px]"
                                      >
                                        Skip
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-[#008545] font-medium mt-1">
                                    E(X) = {problems[currentProblem].distribution
                                      .map(item => `(${item.value} × ${item.probability})`)
                                      .join(' + ')}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 justify-end">
                                    {!stepSkipped.step1 && !showNavigationButtons && (
                                      <span className="text-green-600 font-bold select-none">Great Job!</span>
                                    )}
                                    {!showNavigationButtons && (
                                      <div className="glow-button simple-glow">
                                        <button 
                                          onClick={() => setCurrentStep(2)}
                                          className="bg-[#008545] hover:bg-[#00703d] text-white text-sm px-4 py-2 rounded-md min-w-[80px]"
                                        >
                                          Continue
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          )}

                          {currentStep === 2 && (
                            <>
                              {!stepCompleted.step2 ? (
                                <div className="flex items-center space-x-1 mt-2">
                                  <input
                                    type="text"
                                    value={step2Answer}
                                    onChange={(e) => {
                                      setStep2Answer(e.target.value);
                                      setInvalidAnswers(prev => ({ ...prev, step2: false }));
                                    }}
                                    placeholder="e.g., 0.60 + 1.20 + (-0.60)"
                                    className={`w-full text-sm p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#5750E3] ${
                                      invalidAnswers.step2 ? 'border-yellow-500' : 'border-gray-300'
                                    }`}
                                  />
                                  <div className="glow-button simple-glow">
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={() => {
                                          checkStep2();
                                        }}
                                        className="bg-[#008545] hover:bg-[#00703d] text-white text-sm px-4 py-2 rounded-md min-w-[80px]"
                                      >
                                        Check
                                      </button>
                                      <button 
                                        onClick={() => skipStep(2)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md min-w-[80px]"
                                      >
                                        Skip
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-[#008545] font-medium mt-1">
                                    E(X) = {problems[currentProblem].distribution
                                      .map((item, index) => {
                                        const product = item.value * item.probability;
                                        if (index === 0) {
                                          // First number: no space before minus sign
                                          return product < 0 ? `-${Math.abs(product).toFixed(2)}` : product.toFixed(2);
                                        } else {
                                          // Other numbers: space before sign
                                          return product < 0 ? ` - ${Math.abs(product).toFixed(2)}` : ` + ${product.toFixed(2)}`;
                                        }
                                      })
                                      .join('')}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 justify-end">
                                    {!stepSkipped.step2 && !showNavigationButtons && (
                                      <span className="text-green-600 font-bold select-none">Great Job!</span>
                                    )}
                                    {!showNavigationButtons && (
                                      <div className="glow-button simple-glow">
                                        <button 
                                          onClick={() => setCurrentStep(3)}
                                          className="bg-[#008545] hover:bg-[#00703d] text-white text-sm px-4 py-2 rounded-md min-w-[80px]"
                                        >
                                          Continue
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          )}

                          {currentStep === 3 && (
                            <>
                              {!showSolution ? (
                                <div className="flex items-center space-x-1 mt-2">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={finalAnswer}
                                    onChange={(e) => {
                                      setFinalAnswer(e.target.value);
                                      setInvalidAnswers(prev => ({ ...prev, step3: false }));
                                    }}
                                    placeholder="e.g., 1.20"
                                    className={`w-full text-sm p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#5750E3] ${
                                      invalidAnswers.step3 ? 'border-yellow-500' : 'border-gray-300'
                                    }`}
                                  />
                                  <div className="glow-button simple-glow">
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={checkFinalAnswer}
                                        className="bg-[#008545] hover:bg-[#00703d] text-white text-sm px-4 py-2 rounded-md min-w-[80px]"
                                      >
                                        Check
                                      </button>
                                      <button 
                                        onClick={() => skipStep(3)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md min-w-[80px]"
                                      >
                                        Skip
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-[#008545] font-medium mt-1">
                                    E(X) = {parseFloat(problems[currentProblem].solution).toFixed(2)}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 justify-end">
                                    {!stepSkipped.step3 && !showNavigationButtons && (
                                      <span className="text-green-600 font-bold select-none">Great Job!</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-4">
                          <div
                            className="nav-orbit-wrapper"
                            style={{
                              position: 'relative',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              visibility: showNavigationButtons && currentStep > 1 ? 'visible' : 'hidden',
                              opacity: showNavigationButtons && currentStep > 1 ? 1 : 0,
                              pointerEvents: showNavigationButtons && currentStep > 1 ? 'auto' : 'none',
                              transition: 'opacity 0.2s ease',
                            }}
                          >
                            <div className="nav-button-orbit"></div>
                            <div style={{ position: 'absolute', width: '32px', height: '32px', borderRadius: '50%', background: 'white', zIndex: 1 }}></div>
                            <button
                              onClick={() => handleNavigateHistory('back')}
                              className={`nav-button w-8 h-8 flex items-center justify-center rounded-full bg-[#008545]/20 text-[#008545] hover:bg-[#008545]/30 relative z-50`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6"/>
                              </svg>
                            </button>
                          </div>
                          <span className="text-sm text-gray-500 min-w-[100px] text-center">
                            Step {currentStep} of 3
                          </span>
                          <div
                            className="nav-orbit-wrapper"
                            style={{
                              position: 'relative',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              visibility: showNavigationButtons && currentStep < 3 ? 'visible' : 'hidden',
                              opacity: showNavigationButtons && currentStep < 3 ? 1 : 0,
                              pointerEvents: showNavigationButtons && currentStep < 3 ? 'auto' : 'none',
                              transition: 'opacity 0.2s ease',
                            }}
                          >
                            <div className="nav-button-orbit"></div>
                            <div style={{ position: 'absolute', width: '32px', height: '32px', borderRadius: '50%', background: 'white', zIndex: 1 }}></div>
                            <button
                              onClick={() => handleNavigateHistory('forward')}
                              className={`nav-button w-8 h-8 flex items-center justify-center rounded-full bg-[#008545]/20 text-[#008545] hover:bg-[#008545]/30 relative z-50`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpectedValue;