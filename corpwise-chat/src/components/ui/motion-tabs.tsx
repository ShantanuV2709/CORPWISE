'use client'

import * as React from 'react'
import { motion, type Transition, type HTMLMotionProps } from 'motion/react'
import { cn } from '../../lib/utils'
import { MotionHighlight, MotionHighlightItem } from './motion-highlight'

/* ─── Context ─────────────────────────────────────────────── */
type TabsContextType<T extends string> = {
    activeValue: T
    handleValueChange: (value: T) => void
    registerTrigger: (value: T, node: HTMLElement | null) => void
}

const TabsContext = React.createContext<TabsContextType<any> | undefined>(undefined)

function useTabs<T extends string = string>(): TabsContextType<T> {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error('useTabs must be used within a Tabs provider')
    return context
}

/* ─── Tabs ──────────────────────────────────────────────────── */
type TabsProps<T extends string = string> = React.ComponentProps<'div'> & {
    children: React.ReactNode
    defaultValue?: T
    value?: T
    onValueChange?: (value: T) => void
}

function Tabs<T extends string = string>({
    defaultValue,
    value,
    onValueChange,
    children,
    className,
    style,
    ...props
}: TabsProps<T>) {
    const [activeValue, setActiveValue] = React.useState<T | undefined>(defaultValue)
    const triggersRef = React.useRef(new Map<string, HTMLElement>())
    const initialSet = React.useRef(false)
    const isControlled = value !== undefined

    React.useEffect(() => {
        if (!isControlled && activeValue === undefined && triggersRef.current.size > 0 && !initialSet.current) {
            const firstTab = Array.from(triggersRef.current.keys())[0]
            setActiveValue(firstTab as T)
            initialSet.current = true
        }
    }, [activeValue, isControlled])

    const registerTrigger = (v: string, node: HTMLElement | null) => {
        if (node) {
            triggersRef.current.set(v, node)
            if (!isControlled && activeValue === undefined && !initialSet.current) {
                setActiveValue(v as T)
                initialSet.current = true
            }
        } else {
            triggersRef.current.delete(v)
        }
    }

    const handleValueChange = (val: T) => {
        if (!isControlled) setActiveValue(val)
        else onValueChange?.(val)
    }

    return (
        <TabsContext.Provider value={{ activeValue: (value ?? activeValue)!, handleValueChange, registerTrigger }}>
            <div
                data-slot="tabs"
                className={cn('motion-tabs', className)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}
                {...props}
            >
                {children}
            </div>
        </TabsContext.Provider>
    )
}

/* ─── TabsList ──────────────────────────────────────────────── */
type TabsListProps = React.ComponentProps<'div'> & {
    children: React.ReactNode
    activeClassName?: string
    transition?: Transition
}

function TabsList({
    children,
    className,
    activeClassName,
    transition = { type: 'spring', stiffness: 200, damping: 25 },
    style,
    ...props
}: TabsListProps) {
    const { activeValue } = useTabs()

    return (
        <MotionHighlight
            controlledItems
            className={cn('motion-tabs-highlight', activeClassName)}
            value={activeValue}
            transition={transition}
        >
            <div
                role="tablist"
                data-slot="tabs-list"
                className={cn('motion-tabs-list', className)}
                style={{
                    display: 'inline-flex',
                    height: 44,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    padding: 4,
                    background: 'rgba(255,255,255,0.04)',
                    gap: 4,
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        </MotionHighlight>
    )
}

/* ─── TabsTrigger ────────────────────────────────────────────── */
type TabsTriggerProps = HTMLMotionProps<'button'> & {
    value: string
    children: React.ReactNode
}

function TabsTrigger({ ref, value, children, className, style, ...props }: TabsTriggerProps & { ref?: React.Ref<HTMLButtonElement> }) {
    const { activeValue, handleValueChange, registerTrigger } = useTabs()
    const localRef = React.useRef<HTMLButtonElement | null>(null)
    React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement)

    React.useEffect(() => {
        registerTrigger(value, localRef.current)
        return () => registerTrigger(value, null)
    }, [value, registerTrigger])

    const isActive = activeValue === value

    return (
        <MotionHighlightItem value={value} className="motion-tabs-trigger-wrap" style={{ flex: 1, height: '100%' }}>
            <motion.button
                ref={localRef}
                data-slot="tabs-trigger"
                role="tab"
                onClick={() => handleValueChange(value)}
                data-state={isActive ? 'active' : 'inactive'}
                className={cn('motion-tabs-trigger', className)}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    padding: '0 12px',
                    borderRadius: 9,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                    transition: 'color 0.2s ease',
                    position: 'relative',
                    zIndex: 1,
                    whiteSpace: 'nowrap',
                    ...style,
                }}
                {...props}
            >
                {children}
            </motion.button>
        </MotionHighlightItem>
    )
}

/* ─── TabsContents ───────────────────────────────────────────── */
type TabsContentsProps = React.ComponentProps<'div'> & {
    children: React.ReactNode
    transition?: Transition
}

function TabsContents({
    children,
    className,
    style,
    transition = { type: 'spring', stiffness: 300, damping: 30, bounce: 0, restDelta: 0.01 },
    ...props
}: TabsContentsProps) {
    const { activeValue } = useTabs()
    const childrenArray = React.Children.toArray(children)
    const activeIndex = childrenArray.findIndex(
        (child): child is React.ReactElement<{ value: string }> =>
            React.isValidElement(child) && typeof child.props === 'object' && child.props !== null && 'value' in child.props && (child.props as any).value === activeValue
    )

    return (
        <div
            data-slot="tabs-contents"
            className={cn('motion-tabs-contents', className)}
            style={{ overflow: 'hidden', ...style }}
            {...props}
        >
            <motion.div
                style={{ display: 'flex', marginLeft: '-8px', marginRight: '-8px' }}
                animate={{ x: activeIndex * -100 + '%' }}
                transition={transition}
            >
                {childrenArray.map((child, index) => (
                    <div key={index} style={{ width: '100%', flexShrink: 0, paddingLeft: 8, paddingRight: 8 }}>
                        {child}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

/* ─── TabsContent ────────────────────────────────────────────── */
type TabsContentProps = HTMLMotionProps<'div'> & {
    value: string
    children: React.ReactNode
}

function TabsContent({ children, value, className, style, ...props }: TabsContentProps) {
    const { activeValue } = useTabs()
    const isActive = activeValue === value

    return (
        <motion.div
            role="tabpanel"
            data-slot="tabs-content"
            className={cn('motion-tabs-content', className)}
            style={{ overflow: 'hidden', ...style }}
            initial={{ filter: 'blur(0px)' }}
            animate={{ filter: isActive ? 'blur(0px)' : 'blur(2px)' }}
            exit={{ filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
        >
            {children}
        </motion.div>
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent, useTabs }
export type { TabsContextType, TabsProps, TabsListProps, TabsTriggerProps, TabsContentsProps, TabsContentProps }
