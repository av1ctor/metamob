import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import SM "mo:base/ExperimentalStableMemory";

module {
    public type Pointer = Nat64;
    
    public type Block = {
        offset: Nat64;
        size: Nat64;
        prev: Pointer;
        next: Pointer;
    };

    public type StoredBlockHeader = {
        signature: Nat16;
        version: Nat8;
        reserved: Nat8;
    };

    public type StoredBlock = {
        header: StoredBlockHeader;
        size: Nat64;
        prev: Pointer;
        next: Pointer;
    };
    
    let STORED_BLOCK_SIZE: Nat64 = 32; //sizeof(Nat64) * 4
    let PAGE_SIZE: Nat64 = 65536;
    let INVALID: Nat64 = 0xFFFF_FFFF_FFFF_FFFF;
    let SIGNATURE: Nat64 = 0xDEAD;
    let VERSION: Nat64 = 1;

    public type State = {
        freeHead: Pointer;
        allocTail: Pointer;
    };

    public class Salloc(
    ) {
        var freeHead: Pointer = INVALID;
        var allocTail: Pointer = INVALID;

        public func alloc(
            size: Nat64
        ): Result.Result<Pointer, Text> {
            if(size == 0) {
                return #err("Empty block");
            };
            
            let b = switch(_findFreeBlock(size)) {
                case null {
                    switch(_mergeAndFindFreeBlock(size)) {
                        case null {
                            let pages = ((size + STORED_BLOCK_SIZE) + PAGE_SIZE/2) / PAGE_SIZE;
                            let last = SM.grow(pages);
                            if(last == INVALID) {
                                return #err("Stable memory full");
                            };

                            let b: Block = {
                                offset = last * PAGE_SIZE;
                                size = (pages * PAGE_SIZE) - STORED_BLOCK_SIZE;
                                prev = INVALID;
                                next = INVALID;
                            };

                            b;
                        };
                        case (?b) {
                            b;
                        };
                    };
                };
                case (?h) {
                    h
                };
            };

            _splitFreeBlock(b, size);
            return #ok(_addToAllocatedList(b.offset, size).offset + STORED_BLOCK_SIZE);
        };

        public func free(
            p: Pointer
        ): Result.Result<(), Text> {
            if(not _checkBlock(p - STORED_BLOCK_SIZE)) {
                return #err("Invalid block");
            };

            let block = _loadBlock(p - STORED_BLOCK_SIZE);
            _removeFromAllocatedList(block);
            _addToFreeList(block);
            
            return #ok();
        };

        func _checkBlock(
            offset: Nat64
        ): Bool {
            let header = SM.loadNat64(offset+ 0);
            let signature = (header >> 8) & 0xffff;
            let version = header & 0xff;
            return signature == SIGNATURE and version == VERSION;
        };

        func _loadBlock(
            offset: Nat64
        ): Block {
            return {
                offset = offset;
                size = SM.loadNat64(offset+ 8);
                prev = SM.loadNat64(offset+16);
                next = SM.loadNat64(offset+24);
            };
        };

        func _storeBlock(
            block: Block
        ) {
            let offset = block.offset;
            SM.storeNat64(offset+ 0, (
                (SIGNATURE << 8) |
                (VERSION)
            ));
            SM.storeNat64(offset+ 8, block.size);
            SM.storeNat64(offset+16, block.prev);
            SM.storeNat64(offset+24, block.next);
        };

        func _addToAllocatedList(
            offset: Nat64,
            size: Nat64
        ): Block {
            let b: Block = {
                offset = offset;
                size = size;
                prev = allocTail;
                next = INVALID;
            };
            
            if(allocTail == INVALID) {
                allocTail := offset;
            }
            else {
                let tail = _loadBlock(allocTail);
                _storeBlock({
                    tail
                    with
                    next = offset;
                });
            };

            _storeBlock(b);

            return b;
        };

        func _removeFromAllocatedList(
            block: Block
        ) {
            if(block.prev != INVALID) {
                let prev = _loadBlock(block.prev);
                _storeBlock({
                    prev
                    with
                    next = block.next;
                });
            };

            if(block.next != INVALID) {
                let next = _loadBlock(block.next);
                _storeBlock({
                    next
                    with
                    prev = block.prev;
                });
            }
            else {
                allocTail := block.prev;
            };
        };

        func _addToFreeList(
            block: Block
        ) {
            var phead = freeHead;
            var last: ?Block = null;
            while(true) {
                if(phead != INVALID) {
                    let head = _loadBlock(phead);
                    if(block.offset < head.offset) {
                        let b: Block = {
                            offset = block.offset;
                            size = block.size;
                            prev = head.prev;
                            next = phead;
                        };
                        
                        if(head.prev != INVALID) {
                            let prev = _loadBlock(head.prev);
                            _storeBlock({
                                prev
                                with
                                next = b.offset;
                            });
                        }
                        else {
                            freeHead := b.offset;
                        };
                        
                        _storeBlock(b);
                        return;
                    }
                    else if(head.offset + head.size + STORED_BLOCK_SIZE == block.offset) {
                        _storeBlock({
                            head
                            with
                            size = head.size + block.size;
                        });
                        return;
                    };

                    last := ?head;
                    phead := head.next;
                }
                else {
                    let b: Block = {
                        offset = block.offset;
                        size = block.size;
                        prev = switch(last) {
                            case null 0; 
                            case (?last) last.offset;
                        };
                        next = INVALID;
                    };
                    
                    switch(last) {
                        case (?last) {
                            _storeBlock({
                                last
                                with
                                next = b.offset;
                            });
                        };
                        case null {
                            freeHead := b.offset;
                        };
                    };

                    _storeBlock(b);
                    return;
                };
            };
        };
        
        func _splitFreeBlock(
            b: Block,
            size: Nat64
        ) {
            // if block is too big, split it
            if(b.size > size + STORED_BLOCK_SIZE) {
                let r: Block = {
                    offset = b.offset + size + STORED_BLOCK_SIZE;
                    size = b.size - (size + STORED_BLOCK_SIZE);
                    prev = b.prev;
                    next = b.next;
                };
                if(b.prev != INVALID) {
                    let prev = _loadBlock(b.prev);
                    _storeBlock({
                        prev
                        with
                        next = r.offset;
                    });
                }
                else {
                    freeHead := r.offset;
                };
                
                if(b.next != INVALID) {
                    let next = _loadBlock(b.next);
                    _storeBlock({
                        next
                        with
                        prev = r.offset;
                    });
                };

                _storeBlock(r);
            }
            // remove the whole block from the free list
            else {
                if(b.prev != INVALID) {
                    let prev = _loadBlock(b.prev);
                    _storeBlock({
                        prev
                        with
                        next = b.next;
                    });
                }
                else {
                    freeHead := b.next;
                };

                if(b.next != INVALID) {
                    let next = _loadBlock(b.next);
                    _storeBlock({
                        next
                        with
                        prev = b.prev;
                    });
                };
            };
        };

        func _mergeFreeBlockWithPrev(
            block: Block,
            prev: Block
        ): Block {
            if(block.next != INVALID) {
                let next = _loadBlock(block.next);
                _storeBlock({
                    next
                    with
                    prev = prev.offset;
                });
            };

            let prevUpdated: Block = {
                prev
                with
                size = prev.size + block.size;
                next = block.next;
            };
            _storeBlock(prevUpdated);

            if(prevUpdated.prev != INVALID) {
                let pp = _loadBlock(prevUpdated.prev);
                if(pp.offset + pp.size + STORED_BLOCK_SIZE == prevUpdated.offset) {
                    return _mergeFreeBlockWithPrev(prevUpdated, pp);
                };
            }
            else {
                freeHead := prev.offset;
            };
            
            return prevUpdated;
        };

        func _mergeFreeBlockWithNext(
            block: Block,
            next: Block
        ): Block {
            let blockUpdated: Block = {
                block
                with
                size = block.size + next.size;
                next = next.next;
            };

            _storeBlock(blockUpdated);

            if(next.next != INVALID) {
                let nn = {
                    _loadBlock(next.next)
                    with
                    prev = blockUpdated.offset;
                };
                _storeBlock(nn);

                if(blockUpdated.offset + blockUpdated.size + STORED_BLOCK_SIZE == nn.offset) {
                    return _mergeFreeBlockWithNext(blockUpdated, nn);
                };
            };

            return blockUpdated;
        };

        func _findFreeBlock(
            size: Nat64
        ): ?Block {
            var phead = freeHead;
            
            while(phead != INVALID) {
                let head = _loadBlock(phead);
                if(head.size <= size) {
                    return ?head;
                };

                phead := head.next;
            };
            
            return null;
        };

        func _mergeAndFindFreeBlock(
            size: Nat64
        ): ?Block {
            var last: ?Block = null;            
            var phead = freeHead;
            label l1 while(phead != INVALID) {
                let head = _loadBlock(phead);
                if(head.next == INVALID) {
                    break l1;
                };

                let next = _loadBlock(head.next);
                if(head.offset + head.size + STORED_BLOCK_SIZE <= next.offset) {
                    let n = _mergeFreeBlockWithNext(head, next);
                    if(n.size <= size) {
                        return ?n;
                    };
                    last := ?n;
                    phead := n.next;
                };
            };

            label l2 while(true) {
                switch(last) {
                    case (?l) {
                        if(l.prev == INVALID) {
                            break l2;
                        };

                        let prev = _loadBlock(l.prev);
                        if(prev.offset + prev.size + STORED_BLOCK_SIZE <= l.offset) {
                            let n = _mergeFreeBlockWithPrev(l, prev);
                            if(n.size <= size) {
                                return ?n;
                            };
                            last := if(n.prev != INVALID) ?_loadBlock(n.prev) else null;
                        };
                    };
                    case null {
                        break l2;
                    };
                };
            };
            
            null;
        };

        public func backup(
        ): State {
            return {
                freeHead = freeHead;
                allocTail = allocTail;
            };
        };

        public func restore(
            state: State
        ) {
            freeHead := state.freeHead;
            allocTail := state.allocTail;
        };
    };
};