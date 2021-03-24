import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const cartProductIndex = cart.findIndex((product)=>{
        return product.id === productId;
      });

      const cartAux = cart;

      const stockResponse = await api.get<Stock>(`stock/${productId}`);
      const stock = stockResponse.data;

      if(cartProductIndex !== -1){

        if(cartAux[cartProductIndex].amount < stock.amount){
          cartAux[cartProductIndex].amount += 1;
          setCart([...cartAux]);
          localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cartAux]));
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }

      }else{

        if(stock.amount <= 0){
          toast.error('Quantidade solicitada fora de estoque');
        }else{
          const prodResponse = await api.get<Product>(`products/${productId}`);
          const product = {...prodResponse.data, amount: 1 };

        
          setCart([...cartAux,product]);
          localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cartAux, product]));
        }

      }
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const cartAux =  cart;

      const cartProductIndex = cart.findIndex((product)=>{
        return product.id === productId;
      });

      if(cartProductIndex === -1){
        throw(Error());
      }
      
      cartAux.splice(cartProductIndex,1);
      setCart([...cartAux]);

      localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cartAux]));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const cartAux = cart;
      const cartProductIndex = cart.findIndex((product)=>{
        return product.id === productId;
      });

      const stockResponse = await api.get<Stock>(`stock/${productId}`);
      const stock = stockResponse.data;

      if(amount <= stock.amount && amount >=1){
        cartAux[cartProductIndex].amount = amount;
        setCart([...cartAux]);
        localStorage.setItem('@RocketShoes:cart',JSON.stringify([...cartAux]));
      }else{
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
