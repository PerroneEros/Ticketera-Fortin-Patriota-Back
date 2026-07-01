import { useState, useRef, useEffect, useContext } from 'react';
import { CategoryContext } from '../context/categoryContext';
import { createCategory, updateCategory, deleteCategory } from '../service/categoryService'; 

type ModalType = 'none' | 'agregar' | 'editar' | 'eliminar';

export const CategoryActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [modalType, setModalType] = useState<ModalType>('none');
  const [inputValue, setInputValue] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const context = useContext(CategoryContext);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!context) return null;
  const { categories, loadCategories } = context;

  const handleActionClick = (action: ModalType) => {
    setModalType(action);
    setInputValue('');
    setSelectedCategoryId(categories.length > 0 ? categories[0].category_id.toString() : '');
    setErrorMsg('');
    setIsOpen(false); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (modalType === 'agregar') {
        if (!inputValue.trim()) throw new Error('El nombre no puede estar vacío.');
        await createCategory({ name: inputValue });
      } else if (modalType === 'editar') {
        if (!selectedCategoryId) throw new Error('Selecciona una categoría.');
        if (!inputValue.trim()) throw new Error('El nuevo nombre no puede estar vacío.');
        await updateCategory(selectedCategoryId, { name: inputValue });
      } else if (modalType === 'eliminar') {
        if (!selectedCategoryId) throw new Error('Selecciona una categoría.');
        await deleteCategory(selectedCategoryId);
      }

      await loadCategories();
      setModalType('none');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || error.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="dropdown-container" ref={dropdownRef}>
        <button className="btn-orange" onClick={() => setIsOpen(!isOpen)}>
          + Agregar <span className="chevron">⌄</span>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            <button onClick={() => handleActionClick('agregar')} className="dropdown-item">
              Agregar categoría
            </button>
            <button onClick={() => handleActionClick('editar')} className="dropdown-item">
              Editar categoría
            </button>
            <button onClick={() => handleActionClick('eliminar')} className="dropdown-item danger">
              Eliminar categoría
            </button>
          </div>
        )}
      </div>

      {modalType !== 'none' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {modalType === 'agregar' && 'Agregar Categoría'}
                {modalType === 'editar' && 'Editar Categoría'}
                {modalType === 'eliminar' && 'Eliminar Categoría'}
              </h3>
              <button className="btn-close" onClick={() => setModalType('none')}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {(modalType === 'editar' || modalType === 'eliminar') && (
                  <div className="input-group">
                    <label>Selecciona la categoría</label>
                    <select 
                      value={selectedCategoryId} 
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="" disabled>Seleccione...</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(modalType === 'agregar' || modalType === 'editar') && (
                  <div className="input-group">
                    <label>{modalType === 'editar' ? 'Nuevo nombre de la categoría' : 'Nombre de la categoría'}</label>
                    <input 
                      type="text" 
                      value={inputValue} 
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ej: Postres"
                      disabled={isLoading}
                    />
                  </div>
                )}

                {errorMsg && <p className="error-text">{errorMsg}</p>}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setModalType('none')}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`btn-confirm ${modalType === 'eliminar' ? 'btn-danger' : ''}`}
                  disabled={isLoading}
                >
                  {modalType === 'agregar' && (isLoading ? 'Agregando...' : 'Agregar')}
                  {modalType === 'editar' && (isLoading ? 'Guardando...' : 'Guardar')}
                  {modalType === 'eliminar' && (isLoading ? 'Eliminando...' : 'Eliminar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};