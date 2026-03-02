import { ArrowUpRightIcon } from 'lucide-react';
import { CraftButton, CraftButtonLabel, CraftButtonIcon } from '../../ui/craft-button';

interface CraftButtonDemoProps {
    children?: React.ReactNode;
    onClick?: () => void;
}

const CraftButtonDemo: React.FC<CraftButtonDemoProps> = ({
    children = 'Click me',
    onClick,
}) => {
    return (
        <CraftButton onClick={onClick}>
            <CraftButtonLabel>{children}</CraftButtonLabel>
            <CraftButtonIcon>
                <ArrowUpRightIcon />
            </CraftButtonIcon>
        </CraftButton>
    );
};

export default CraftButtonDemo;
