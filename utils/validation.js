const validateItem = (data) => {
    const { name, description, category, condition } = data; // Include all validated fields
    const errors = [];
  
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string.');
    }
  
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description is required and must be a non-empty string.');
    }
  
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('Category is required and must be a non-empty string.');
    }
  
    if (!condition || typeof condition !== 'string' || condition.trim().length === 0) {
      errors.push('Condition is required and must be a non-empty string.');
    }
  console.log(errors);
    return errors;
  };
  
  module.exports = { validateItem };
  
  
  
  
  