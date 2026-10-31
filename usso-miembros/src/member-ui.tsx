import {createContext,useContext,useRef,type PropsWithChildren,type InputHTMLAttributes,type ComponentType} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Mobile from './mobile';
type SheetProps=PropsWithChildren<{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;snap?:number}>;
type UI={Scroll:ComponentType<PropsWithChildren<{className?:string}>>;Sheet:ComponentType<SheetProps>;Input:ComponentType<InputHTMLAttributes<HTMLInputElement>>;keyboard:{hide:()=>void};insets:{bottomInset:number;isKeyboardVisible:boolean}};
const UIContext=createContext<UI|null>(null);
function useMemberUI(){const value=useContext(UIContext);if(!value)throw new Error('Missing member UI provider');return value}
export function MobileMemberUI({children}:PropsWithChildren){const keyboard=Mobile.useKeyboard(),insets=Mobile.useKeyboardInsets();return <UIContext.Provider value={{Scroll:Mobile.MobileScroll,Sheet:Mobile.BottomSheet,Input:Mobile.KeyboardInput,keyboard,insets}}>{children}</UIContext.Provider>}
function NativeScroll({children,className}:PropsWithChildren<{className?:string}>){return <section className={`web-scroll ${className||''}`}>{children}</section>}
function NativeInput(props:InputHTMLAttributes<HTMLInputElement>){return <input {...props}/>}
function NativeSheet({children,open,onOpenChange,title,description}:SheetProps){return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="web-sheet-overlay"/><Dialog.Content className="bottom-sheet web-sheet" aria-describedby={description?'web-sheet-description':undefined}><div className="sheet-header"><Dialog.Title className="sheet-title">{title}</Dialog.Title>{description&&<Dialog.Description id="web-sheet-description" className="sheet-description">{description}</Dialog.Description>}</div><div className="sheet-content">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>}
export function WebMemberUI({children}:PropsWithChildren){const value=useRef<UI>({Scroll:NativeScroll,Sheet:NativeSheet,Input:NativeInput,keyboard:{hide:()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur()}},insets:{bottomInset:0,isKeyboardVisible:false}}).current;return <UIContext.Provider value={value}>{children}</UIContext.Provider>}
export function MobileScroll(props:PropsWithChildren<{className?:string}>){const C=useMemberUI().Scroll;return <C {...props}/>}
export function BottomSheet(props:SheetProps){const C=useMemberUI().Sheet;return <C {...props}/>}
export function KeyboardInput(props:InputHTMLAttributes<HTMLInputElement>){const C=useMemberUI().Input;return <C {...props}/>}
export function useKeyboard(){return useMemberUI().keyboard}
export function useKeyboardInsets(){return useMemberUI().insets}
